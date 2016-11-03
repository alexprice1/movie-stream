const fs = require('fs');
const http = require('http');
const url = require('url');
const path = require('path');

http.createServer(function (req, res) {
  if (req.url !== '/movie.mov') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end("<video src='http://localhost:8888/movie.mov' controls></video>");
  } else {
    const file = path.resolve(__dirname,'movie.mov');

    fs.stat(file, function(err, stats) {
      if (err) {
        if (err.code === 'ENOENT') {
          // 404 Error if file not found
          return res.sendStatus(404);
        }

        res.end(err);
      }

      const range = req.headers.range;
      if (!range) {
       // 416 Wrong range
       return res.sendStatus(416);
      }
      const positions = range.replace(/bytes=/, '').split('-');
      const start = parseInt(positions[0], 10);
      const total = stats.size;
      const end = positions[1] ? parseInt(positions[1], 10) : total - 1;
      const chunksize = (end - start) + 1;

      res.writeHead(206, {
        'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4'
      });

      const stream = fs.createReadStream(file, { start, end })
        .on('open', function() {
          stream.pipe(res);
        }).on('error', function(err) {
          res.end(err);
        });
    });
  }
}).listen(8888);