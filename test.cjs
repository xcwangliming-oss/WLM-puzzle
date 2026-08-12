const ffmpeg = require('fluent-ffmpeg');
const installer = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(installer.path);

ffmpeg()
  .input('color=c=red:s=100x100')
  .inputFormat('lavfi')
  .input('color=c=white:s=100x100')
  .inputFormat('lavfi')
  .complexFilter([
    '[1:v]format=gray[alpha]',
    '[0:v][alpha]alphamerge[out]'
  ])
  .outputOptions([
    '-map', '[out]',
    '-c:v', 'prores_ks',
    '-profile:v', '4444',
    '-pix_fmt', 'yuva444p10le',
    '-t', '1',
    '-y'
  ])
  .save('test.mov')
  .on('end', () => console.log('Done'))
  .on('error', console.error);
