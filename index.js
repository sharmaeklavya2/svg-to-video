let fs = require('fs');
let child_process = require('child_process');
let puppeteer = require("puppeteer");

const usage = 'usage: node index.js <svgPath> <duration> <fps> <outDir>';

async function main() {
    let [nodePath, progPath, svgPath, duration, fps, outDir] = process.argv;
    if(outDir === undefined) {
        console.error('outDir is not defined');
        console.log(usage);
        process.exit(2);
    }
    const svg = fs.readFileSync(svgPath, 'utf-8');

    duration = parseFloat(duration);
    fps = parseInt(fps);
    console.log('duration: ' + duration + ' s, fps: ' + fps);
    const totalFrames = Math.floor(fps * duration);
    const digits = Math.floor(Math.log10(totalFrames)) + 1;
    console.log('totalFrames: ' + totalFrames);

    process.chdir(outDir);
    await createFrames(svg, fps, totalFrames, digits);
    convertToMP4(fps, totalFrames, digits);
}

async function createFrames(svg, fps, totalFrames, digits) {
    svg = svg.replace('--play-state: running;', '--play-state: paused;');

    let browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--font-render-hinting=none']
    });

    let page = await browser.newPage();
    await page.goto('about:blank');
    await page.setContent(svg);

    let renderSettings = {
        type: 'jpeg',
        omitBackground: true,
        quality: 100,
    };

    console.log('creating frames');
    for(let i=1; i <= totalFrames; ++i) {
        let result = await page.evaluate(function(startVal) {
            document.getElementsByTagName('svg')[0].style.setProperty('--start', startVal);},
            '' + (i / fps) + 's');
        await page.waitForTimeout(1);

        let outputElem = await page.$('svg');
        let prefix = ('' + i).padStart(digits, '0');
        renderSettings.path = prefix + '.jpg';
        await outputElem.screenshot(renderSettings);
        if(i % fps === 0 || i === totalFrames) {
            console.log('progress: ' + prefix + ' / ' + totalFrames);
        }
    }

    await browser.close();
    return totalFrames, digits;
}

function convertToMP4(fps, totalFrames, digits) {
    let output = child_process.execFileSync('ffmpeg',
        ['-hide_banner', '-loglevel', 'warning', '-y',
            '-framerate', '' + fps,
            '-i', '%0' + digits + 'd.jpg',
            '-c:v', 'libx264', '-vf', 'fps=' + fps,
            'output.mp4'],
        {'encoding': 'utf8'});
    console.log(output);
}

main();
