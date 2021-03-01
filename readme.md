# Animated SVG to MP4

Converts a CSS-animated SVG to an MP4 video.

On macOS, you may suffer from poor performance:
<https://github.com/puppeteer/puppeteer/issues/476>.

## Installing dependencies

Install `nodejs` and `ffmpeg`.
Then install node dependencies by running `npm install`.

## Example invocation

    mkdir out-dir
    node index.js example.svg 2 24 out-dir

This command will read `example.svg` as input and create a 2 seconds long animation
at 24 frames-per-second. The output is stored in the file `out-dir/output.mp4`.

## SVG format

All animated elements should set
[`animation-play-state`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-play-state)
equal to `paused` or `var(--play-state)`, where `--play-state` is
a custom CSS property attached to the `svg` element.

There should be a custom CSS property `--start` attached to the `svg` element.
This represents the instant at which to start the animation.
All animated elements should use
[`animation-delay`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-delay)
and incorporate the value `--start` in it.

See `example.svg` for an example.

## How it works

`index.js` reads the SVG file and changes the value of `--play-state` to `paused`.
It then opens up a headless browser using `puppeteer` and loads the SVG into it.
Then it repeatedly changes the value of `--start` and takes screenshots.
Those screenshots are converted to an mp4 file using `ffmpeg`.
