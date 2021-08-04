const express = require("express");
const ytdl = require("ytdl-core")
const fetch = require("node-fetch");
const request = require("request");
const cp = require('child_process');
const readline = require('readline');
const ffmpeg = require('ffmpeg-static');
const app = express();
const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
        // res.json({
        //         message: "Request successful"
        // })
        res.sendFile(__dirname + "/public/index.html")
})

app.get("/video-info", async function (req, res) {
        const videoURL = req.query.videoURL;
        const info = await ytdl.getInfo(videoURL);
        res.status(200).json(info);

})

app.get("/download-video", async function (req, res) {
        const videoURL = req.query.videoURL;

        const ref = videoURL
        const itag = req.query.itag;
        const title = req.query.title
        let info = title;
        res.header("Content-Disposition", `attachment;filename=${title}.mp4`)
        const tracker = {
                start: Date.now(),
                audio: { downloaded: 0, total: Infinity },
                video: { downloaded: 0, total: Infinity },
                merged: { frame: 0, speed: '0x', fps: 0 },
        };

        // Get audio and video streams
        const audio = ytdl(ref, { filter: 'audioonly', })
                .on('progress', (_, downloaded, total) => {
                        tracker.audio = { downloaded, total };
                });
        const video = ytdl(ref, { filter: format => format.itag == itag })
                .on('progress', (_, downloaded, total) => {
                        tracker.video = { downloaded, total };
                });

        // Prepare the progress bar
        let progressbarHandle = null;
        const progressbarInterval = 1000;
        const showProgress = () => {
                readline.cursorTo(process.stdout, 0);
                const toMB = i => (i / 1024 / 1024).toFixed(2);

                process.stdout.write(`Audio  | ${(tracker.audio.downloaded / tracker.audio.total * 100).toFixed(2)}% processed `);
                process.stdout.write(`(${toMB(tracker.audio.downloaded)}MB of ${toMB(tracker.audio.total)}MB).${' '.repeat(10)}\n`);

                process.stdout.write(`Video  | ${(tracker.video.downloaded / tracker.video.total * 100).toFixed(2)}% processed `);
                process.stdout.write(`(${toMB(tracker.video.downloaded)}MB of ${toMB(tracker.video.total)}MB).${' '.repeat(10)}\n`);

                process.stdout.write(`Merged | processing frame ${tracker.merged.frame} `);
                process.stdout.write(`(at ${tracker.merged.fps} fps => ${tracker.merged.speed}).${' '.repeat(10)}\n`);

                process.stdout.write(`running for: ${((Date.now() - tracker.start) / 1000 / 60).toFixed(2)} Minutes.`);
                readline.moveCursor(process.stdout, 0, -3);
        };

        // Start the ffmpeg child process
        const ffmpegProcess = cp.spawn(ffmpeg, [
                // Remove ffmpeg's console spamming
                '-loglevel', '8', '-hide_banner',
                // Redirect/Enable progress messages
                '-progress', 'pipe:3',
                // Set inputs
                '-i', 'pipe:3',
                '-i', 'pipe:4',
                // Map audio & video from streams
                '-map', '0:a',
                '-map', '1:v',
                // Keep encoding
                '-c:v', 'copy',
                // Define output file
                // 'out.mp4',
                '-f', 'mpegts'/*'matroska*/, 'pipe:5'
        ], {
                windowsHide: true,
                stdio: [
                        /* Standard: stdin, stdout, stderr */
                        'inherit', 'inherit', 'inherit',
                        /* Custom: pipe:3, pipe:4, pipe:5 */
                        'pipe', 'pipe', 'pipe', 'pipe'
                ],
        });
        ffmpegProcess.on('close', () => {

                console.log('done');
                // Cleanup
                process.stdout.write('\n\n\n\n');
                clearInterval(progressbarHandle);
        });

        // Link streams
        // FFmpeg creates the transformer streams and we just have to insert / read data
        ffmpegProcess.stdio[3].on('data', chunk => {
                // Start the progress bar
                if (!progressbarHandle) progressbarHandle = setInterval(showProgress, progressbarInterval);
                // Parse the param=value list returned by ffmpeg
                const lines = chunk.toString().trim().split('\n');
                const args = {};
                for (const l of lines) {
                        const [key, value] = l.split('=');
                        args[key.trim()] = value.trim();
                }
                tracker.merged = args;
        });
        audio.pipe(ffmpegProcess.stdio[3]);
        video.pipe(ffmpegProcess.stdio[4]);
        res.header("Content-Disposition", `attachment;filename=video.mp4`)
        ffmpegProcess.stdio[5].pipe(res);

})


app.get("/download-audio", async function (req, res) {
        const videoURL = req.query.videoURL;
        // const itag = req.query.itag;
        let info = req.query.title;
        // console.log(videoURL);
        res.header("Content-Disposition", `attachment;filename=${info}.mp3`);
        ytdl(videoURL, {
                filter: 'audioonly'
        }).pipe(res);
})

app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`)
})