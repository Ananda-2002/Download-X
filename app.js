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
        const itag = req.query.itag;
        let info = req.query.title;
        // const ref = videoURL;
        res.header("Content-Disposition", `attachment;filename=${info}.mp4`)

        // // Get audio and video streams
        // const audio = ytdl(ref, { filter: 'audioonly' })

        // const video = ytdl(ref, { filter: format => format.itag == itag })

        // // Start the ffmpeg child process
        // const ffmpegProcess = cp.spawn(ffmpeg, [
        //         // Remove ffmpeg's console spamming
        //         '-loglevel', '8', '-hide_banner',
        //         // Redirect/Enable progress messages
        //         '-progress', 'pipe:3',
        //         // Set inputs
        //         '-i', 'pipe:4',
        //         '-i', 'pipe:5',
        //         // Map audio & video from streams
        //         '-map', '0:a',
        //         '-map', '1:v',
        //         // Keep encoding
        //         '-c:v', 'copy',
        //         // Define output file
        //         `${info}.mp4`,
        //         '-f', 'matroska', 'pipe:6',
        // ], {
        //         windowsHide: true,
        //         stdio: [
        //                 /* Standard: stdin, stdout, stderr */
        //                 'inherit', 'inherit', 'inherit',
        //                 /* Custom: pipe:3, pipe:4, pipe:5 */
        //                 'pipe', 'pipe', 'pipe', 'pipe'
        //         ],
        // });

        // ffmpegProcess.on('close', () => {
        //         console.log('done');
        //         // Cleanup
        //         process.stdout.write('\n\n\n\n');
        // });

        // // Link streams
        // // FFmpeg creates the transformer streams and we just have to insert / read data
        // ffmpegProcess.stdio[3].on('data', chunk => {
        //         const lines = chunk.toString().trim().split('\n');
        //         const args = {};
        //         for (const l of lines) {
        //                 const [key, value] = l.split('=');
        //                 args[key.trim()] = value.trim();


        //         }

        // });
        // audio.pipe(ffmpegProcess.stdio[4]);
        // video.pipe(ffmpegProcess.stdio[5]);



        // ===============================================================================
        res.header("Content-Disposition", `attachment;filename=${info}.mp4`);
        ytdl(videoURL, {
                filter: format => format.itag == itag
        }).pipe(res);

})

app.get("/download-audio", async function (req, res) {
        const videoURL = req.query.videoURL;
        // const itag = req.query.itag;
        let info = req.query.title;
        console.log(videoURL);
        res.header("Content-Disposition", `attachment;filename=${info}.mp3`);
        ytdl(videoURL, {
                filter: 'audioonly'
        }).pipe(res);
})

app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`)
})