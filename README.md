# Handwriting

Handwriting is a plugin for [Reveal.js](https://github.com/hakimel/reveal.js).
This plugin provides a option you annotate to your presentation with a mouse, touch and pen.
Some functions of this plugin are based on [Chalkboard of reveal.js-plugins](https://github.com/rajgoel/reveal.js-plugins/tree/master/chalkboard).

[Check out the live demo](https://satoshifuku.github.io/handwriting/demo/demo.html)

## Installation

Copy the follwing file and directories to __plugin/handwriting__ in your project:
- handwriting.js
- img/
- awsome-font/

Add the plugin to the dependencies in your presentation, as below.

```javascript
Reveal.initialize({
	// ...
	dependencies: [
		// ... 
		{ src: 'plugin/handwriting/handwriting.js' },
		// ... 
	]
});
```

## Keyboard option

You can define key assignment to use additional functions in the dependencies.

```javascript
    'key code': fucntion () {RevealHandWriting.'function'}
```

Example in the demo.

```javascript
Reveal.initialize({
	// ...
    keyboard: {
        67: function () { RevealHandWriting.colorCycle() },	// Change color with 'c'.
        46: function () { RevealHandWriting.clear() },	    // Clear drawn things with 'DEL'.
        68: function () { RevealHandWriting.download() },	// Downlad drawn things on a slide with 'd'.
    },	
	// ... 
});
```

### Function list

|Name|Detail|
|:---|:---|
|toggleNotesCanvas()|Toggle enable and disable marker mode|
|toggleChalkboard()|Toggle enable and disable chalk mode|
|clear()|Clear chalkboard|
|reset()|Reset chalkboard data on current slide|
|download()|Downlad recorded drawing|
|colorCycle()|Change colors|

## Usage

### Toggle drawing mode 

Press a pen icon in lower-left of your slide.

### Two Drawing modes:
- Maker pen(default)
- chalk

### Erasing mode:

On the drawing mode, Press an eraser icon in lower-left of your slide to toggle the Erasing mode.

### Mouse

Drawing: Click a left button and drag

Eraser: Click the right button and drag

### Touch and pen

Drawing: Touch and move

Eraser: Touch and hold for half a second, then move

## Doker image

The [Docker image](https://hub.docker.com/r/hosta1/revealjs_nginx) allows you use the handwriting's plugin easily.

[The Github repositoly for docker file](https://github.com/satoshifuku/RevealJsOnNginx)
