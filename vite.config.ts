import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import url from 'url';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const progressMap = new Map<string, number>();

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  plugins: [
    {
      name: 'ffmpeg-converter',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const parsedUrl = url.parse(req.url!, true);
          
          if (parsedUrl.pathname === '/api/progress' && req.method === 'GET') {
              const taskId = parsedUrl.query.taskId as string;
              const pct = progressMap.get(taskId) || 0;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ progress: pct }));
              return;
          }

          if (parsedUrl.pathname === '/api/convert' && req.method === 'POST') {
             const taskId = (parsedUrl.query.taskId as string) || Date.now().toString();
             const duration = parseFloat((parsedUrl.query.duration as string) || '0');
             const mode = parsedUrl.query.mode === 'mp4' ? 'mp4' : 'alpha';
             const fpsParam = Number((parsedUrl.query.fps as string) || 30);
             const fps = Math.max(24, Math.min(60, Number.isFinite(fpsParam) ? Math.round(fpsParam) : 30));
             const keyframeInterval = Math.max(1, fps * 2);
             const webmPath = path.resolve(`./temp_${taskId}.webm`);
             const movPath = path.resolve(`./temp_${taskId}.mov`);
             const mp4Path = path.resolve(`./temp_${taskId}.mp4`);
             
             progressMap.set(taskId, 0);

             const writeStream = fs.createWriteStream(webmPath);
             req.pipe(writeStream);
             
             req.on('end', () => {
                 if (mode === 'mp4') {
                   ffmpeg(webmPath)
                    .outputOptions([
                        '-map', '0:v:0',
                        '-map', '0:a?',
                        '-fflags', '+genpts',
                        '-vf', `fps=${fps}:round=near,format=yuv420p`,
                        '-fps_mode', 'cfr',
                        '-c:v', 'libx264',
                        '-preset', 'veryfast',
                        '-crf', '20',
                        '-pix_fmt', 'yuv420p',
                        '-g', String(keyframeInterval),
                        '-keyint_min', String(keyframeInterval),
                        '-sc_threshold', '0',
                        '-threads', '0',
                        '-c:a', 'aac',
                        '-b:a', '192k',
                        '-movflags', '+faststart'
                    ])
                   .on('progress', (progress) => {
                       if (duration > 0 && progress.timemark) {
                           const parts = progress.timemark.split(':');
                           const h = parseFloat(parts[0]);
                           const m = parseFloat(parts[1]);
                           const s = parseFloat(parts[2]);
                           const totalSeconds = h * 3600 + m * 60 + s;
                           let percent = (totalSeconds / duration) * 100;
                           if (percent > 100) percent = 100;
                           progressMap.set(taskId, percent);
                       }
                   })
                   .save(mp4Path)
                   .on('end', () => {
                       res.setHeader('Content-Type', 'video/mp4');
                       res.setHeader('Content-Disposition', 'attachment; filename="direct-output.mp4"');
                       const readStream = fs.createReadStream(mp4Path);
                       readStream.pipe(res);
                       readStream.on('end', () => {
                           progressMap.delete(taskId);
                           if (fs.existsSync(webmPath)) fs.unlinkSync(webmPath);
                           if (fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path);
                       });
                   })
                   .on('error', (err) => {
                       console.error('FFmpeg MP4 Conversion Error:', err);
                       progressMap.delete(taskId);
                       res.statusCode = 500;
                       res.end('Conversion failed');
                       if (fs.existsSync(webmPath)) fs.unlinkSync(webmPath);
                       if (fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path);
                   });
                   return;
                 }

                 ffmpeg(webmPath)
                   .complexFilter([
                       '[0:v]format=yuv420p,split=2[left][right]', // 强制剥离Chrome录制的残留假Alpha通道！
                       '[left]crop=iw/2:ih:0:0[rgb]',       // 左半边：RGB画面
                       '[right]crop=iw/2:ih:iw/2:0,format=gray[alpha]',  // 右半边：转为单通道灰度图
                       '[rgb][alpha]alphamerge[out]'       // 将灰度图的亮度映射为真正的 Alpha 通道
                   ])
                    .outputOptions([
                        '-map', '[out]',
                        '-map', '0:a?',
                        '-c:v', 'prores_ks',      // 使用 Apple ProRes 编码器，而不是巨大的 qtrle
                        '-profile:v', '4',        // 4 代表 ProRes 4444，支持透明通道且体积大幅减小
                        '-pix_fmt', 'yuva444p10le', // 必须指定 10-bit YUV + Alpha 格式才能包含透明通道并被剪辑软件识别
                        '-c:a', 'pcm_s16le'       // 标准无损PCM音频，广泛兼容剪辑软件
                    ])
                   .on('progress', (progress) => {
                       if (duration > 0 && progress.timemark) {
                           const parts = progress.timemark.split(':');
                           const h = parseFloat(parts[0]);
                           const m = parseFloat(parts[1]);
                           const s = parseFloat(parts[2]);
                           const totalSeconds = h * 3600 + m * 60 + s;
                           let percent = (totalSeconds / duration) * 100;
                           if (percent > 100) percent = 100;
                           progressMap.set(taskId, percent);
                       }
                   })
                   .save(movPath)
                   .on('end', () => {
                       res.setHeader('Content-Type', 'video/quicktime');
                       res.setHeader('Content-Disposition', 'attachment; filename="combo-material.mov"');
                       const readStream = fs.createReadStream(movPath);
                       readStream.pipe(res);
                       readStream.on('end', () => {
                           progressMap.delete(taskId);
                           if (fs.existsSync(webmPath)) fs.unlinkSync(webmPath);
                           if (fs.existsSync(movPath)) fs.unlinkSync(movPath);
                       });
                   })
                   .on('error', (err) => {
                       console.error('FFmpeg Conversion Error:', err);
                       progressMap.delete(taskId);
                       res.statusCode = 500;
                       res.end('Conversion failed');
                       if (fs.existsSync(webmPath)) fs.unlinkSync(webmPath);
                   });
             });
             return;
          }
          next();
        });
      }
    }
  ]
});
