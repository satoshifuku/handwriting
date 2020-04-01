# Handwriting

Handwriting is a plugin for [Reveal.js](https://github.com/hakimel/reveal.js).
This plugin provides a option you annotate to your presentation with handwriting.
Some functions of this plugin are based on [Chalkboard of reveal.js-plugins](https://github.com/rajgoel/reveal.js-plugins/tree/master/chalkboard).

[Check out the live demo](https://satoshifuku.github.io/handwriting/demo/demo.html)

## Installation

Copy the follwing file and directories to __plugin/handwriting__ in your project:
- chalkboard.js
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
|toggleNotesCanvas()|Toggle open and close notes canvas|
|toggleChalkboard()|Toggle  open and close chalkboard|
|clear()|Clear chalkboard|
|reset()|Reset chalkboard data on current slide|
|download()|Downlad recorded drawing|
|colorCycle()|Change colors|


