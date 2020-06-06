

let RevealHandWriting = window.RevealHandWriting || (function () {
	let path = scriptPath();

	function scriptPath() {
		// obtain plugin path from the script element
		let src;
		if (document.currentScript) {
			src = document.currentScript.src;
		} else {
			let sel = document.querySelector( 'script[src$="/handWriting.js"]' )
			if (sel) {
				src = sel.src;
			}
		}

		let path = typeof src === undefined ? src : src.slice(0, src.lastIndexOf( "/" ) + 1);

		return path;
	}

	try {
		window.addEventListener( "test", null, Object.defineProperty({}, "passive", { get: function () { passiveSupported = true; } }));
	} catch (err) { }


	function loadfont(fontpath) {
		var head = document.querySelector( 'head' );
		resource = document.createElement( 'link' );
		resource.rel = 'stylesheet';
		resource.href = fontpath;

		// resource.onload = finish;
		head.appendChild( resource );
	}

	let fontpath = 'plugin/handwriting/font-awesome/css/all.css';
	loadfont(fontpath);	
	
	let gHSLA = { hue: 60, saturation: 0, lightness: 50 };

	const iconEditing = 'fa-user-edit';
	const icons = {marker: 'fa-pen-alt', chalk: 'fa-pen', eraser: 'fa-eraser'};
	const actionType = {draw: "draw", erase: "erase", setColor: "setcolor"};

	
	let pointers = {
		marker: {
			color: setHSLa(1),
			color_alpha: 1,
			cursor: 'url( ' + path + 'img/marker.png) 16 16, auto',
			rememberColor: true,
			button: {
				left: "30px", bottom: "70px", top: "auto", right: "auto",
				innerHTML: '<a onclick="RevealHandWriting.toggleNotesCanvas(this);"><i class="' +  'fas '+ icons.marker +'"></i></a>'
			},
			lineWidth: 7,
			canvas: {
				name: "notescanvas",
				context: null,
				container: null,
				backgroundColor: 'rgba(127,127,127,.1)',
				scale: 1, width: 0, height: 0,
				offset:{x: 0, y: 0}
			}
		},
		chalk: {
			color: setHSLa(1),
			color_alpha: 1,			
			cursor: 'url( ' + path + 'img/chalk.png) 16 16, auto',
			rememberColor: false,
			button: {
				left: "30px", bottom: "30px", top: "auto", right: "auto",
				innerHTML: '<a onclick="RevealHandWriting.toggleChalkboard(this);"><i class="' +  'fas ' + icons.chalk +'"></i></a>'
			},
			lineWidth: 15,
			effect: 1.0,
			canvas: {
				name: "chalkboard",
				context: null,
				container: null,
				scale: 1, width: 0, height: 0,
				offset:{x: 0, y: 0},
				type: {
					whiteBoard: {
						backgroundColor: 'rgba(127,127,127,.1)', gridColor: 'rgb(127,127,255,0.1)',
						src: 'url( "' + path + 'img/whiteboard.png'
					},
					blackBoard: {
						backgroundColor: 'rgb(127,127,255,.1)',	gridColor: 'rgb(50,50,10,0.5)',
						src: 'url( "' + path + 'img/blackboard.png'
					},
					width: 1
				}
			}
		},
		eraser: {
			color: setHSLa(1),
			color_alpha: 1,			
			cursor: 'url( ' + path + 'img/chalk.png) 16 16, auto',
			rememberColor: false,
			button: {
				left: "30px", bottom: "110px", top: "auto", right: "auto",
				innerHTML: '<a onclick="RevealHandWriting.toggleraser(this);"><i class="' +  'fas ' + icons.eraser +'"></i></a>'
			},
			radius: 20, 
			visibility: "hidden",	
		}
	};


	let storages = resetStorages();

	function resetStorages(){
		let st = {
			marker: { width: Reveal.getConfig().width, height: Reveal.getConfig().height, data: [] },
			chalk: { width: Reveal.getConfig().width, height: Reveal.getConfig().height, data: [] },
			eraser: { width: Reveal.getConfig().width, height: Reveal.getConfig().height, data: [] }
		};
		return st
	}

	let currentKey = "none";

	let mouse = { x: 0, y: 0 };
	let last = { x: 0, y: 0 };
	let slideIndices = { h: 0, v: 0 };
	let action = null;
	let timerID4slideChanged = null;

	let config = configure(Reveal.getConfig().chalkboard || {}, pointers);

	function configure(config, data) {
		// reading with recursion.
		for ( key in config) {
			if (typeof config[key] == "object" ) {
				if ( key in data) configure(config[key], data[key]);
				else configure(config[key], data[key] = {});
			}
			else {
				data[key] = config[key];
			}
		}
		return config;
	}

	function setHSLa(a) {
		return 'hsla( ' + String(gHSLA.hue) + ',' + String(gHSLA.saturation) + '%,' + String(gHSLA.lightness) + '%,' + String(a) + ' )';
	}

	function setColor2Pen(key, color) {

		let elem = document.getElementById( "toggle-" + key);
		elem.getElementsByClassName( icons[key] )[0].style.color = color;

		pointers[key].color = color;
	}

	function setColor2Pens(color=null) {
		let color_hsl = color; 
		for (key in pointers){
			color_hsl = color == null ? setHSLa(pointers[key].color_alpha) : color;
			setColor2Pen(key,color_hsl);
		}

		return color_hsl;
	}

	function setScaleOffset(pointer){
		let s = pointer.canvas.scale;
		let offset = pointer.canvas.offset
		return {scale: s, offset: offset};	
	}

	function assignVector(from, to){
		to.x = from.x;
		to.y = from.y;
	}

	function calculateAdjustedVector(scale, coordinate, offset){ //fx = scale * coordinate + offset
		let vector = {x: 0, y: 0};
		vector.x = scale * coordinate.x + offset.x;
		vector.y = scale * coordinate.y + offset.y;		
		return vector;
	}

	function calculateVectorNonScaled(from, to, scale){
		let vector = {x: 0, y: 0};
		vector.x = (to.x - from.x) / scale;
		vector.y = (to.y - from.y) / scale;		
		return vector;		
	}

	for ( key in pointers) {
		let button = document.createElement( "div" );
		button.className = "mode-button";
		button.id = "toggle-" + key;
		button.style.visibility = key != "eraser" ? "visible" : "hidden";
		button.style.position = "absolute";
		button.style.zIndex = 30;
		button.style.fontSize = "24px";

		for (child in pointers[key].button) {
			let val = pointers[key].button[child];
			if (child != "innerHTML" ) button.style[child] = val;
			else button.insertAdjacentHTML( 'afterbegin', val );
		}

		document.querySelector( ".reveal" ).appendChild(button);
	}
	setupDrawingCanvas();

	function setupDrawingCanvas() {

		for ( key in pointers) {

			let container = document.createElement( "div" );
			if ( key != "eraser" ) container.id = pointers[key].canvas.name;
			container.style.cursor = pointers[key].cursor;

			container.classList.add( 'overlay' );
			container.setAttribute( 'data-prevent-swipe', '' );
			container.oncontextmenu = function () { return false; }
			container.style.pointerEvents = "none";

			if ( key != "eraser" ) setWindowParameter(pointers[key], storages[key]);

			if ( key == "marker" ) container.style.background = pointers.marker.canvas.backgroundColor;
			else if ( key == "chalk" ) container.style.background = pointers.chalk.canvas.type.blackBoard.src + '" ) repeat';
			else{}

			container.style.zIndex = "24";

			let canvas = document.createElement( 'canvas' );
			canvas.setAttribute( 'data-handwriting', key);

			for (cKey in pointers[key].canvas) {
				let a = pointers[key].canvas[cKey];
				canvas[cKey] = a;
			}

			canvas.style.cursor = pointers[key].cursor;
			container.appendChild(canvas);
			pointers[key].canvas = canvas;

			pointers[key].canvas.context = canvas.getContext( "2d" );

			document.querySelector( '.reveal' ).appendChild(container);
			pointers[key].canvas.container = container;
		}
	}

	function setWindowParameter(pointer, storage){
		let windowParameters = calcurateWindowParameter(storage);
		for (parameter in windowParameters){
			pointer.canvas[parameter] = windowParameters[parameter];
		}
	}

	function calcurateWindowParameter(storage){
		let windowParam = {width: 0, height: 0, scale: 0, offset: {x: 0, y: 0}};
		windowParam.width = window.innerWidth;
		windowParam.height = window.innerHeight;
		windowParam.scale = Math.min(window.innerWidth / storage.width, window.innerHeight / storage.height);
		windowParam.offset.x = 0.5 * (window.innerWidth - storage.width * windowParam.scale);
		windowParam.offset.y = 0.5 * (window.innerHeight - storage.height * windowParam.scale);

		return windowParam;
	}

	setColor2Pens();

	let loaded = null;
	if (config.src != null) {
		loadJSON(config.src);
	}

	function loadJSON( filename ) {
		let xhr = new XMLHttpRequest();
		xhr.onload = function () {
			if (xhr.readyState === 4 && xhr.status != 404) {
				storages = JSON.parse(xhr.responseText);
				for ( key in storages) {
					setWindowParameter(pointers[key], storages[key]);
				}
				loaded = true;
			}
			else {
				console.warn( "Failed to load file " + filename + ". ReadyState: " + xhr.readyState + ", Status: " + xhr.status);
				loaded = false;
			}
		};

		xhr.open( 'GET', filename, true);
		try {
			xhr.send();
		}
		catch (error) {
			console.warn( "Failed to load file " + filename + ".");
			loaded = false;
		}
	}

	function downloadJSON() {
		let a = document.createElement( 'a' );
		document.body.appendChild(a);
		try {
			// cleanup slide data without events
			for ( key in pointers) {
				for (let i = storages[key].data.length - 1; i >= 0; i--) {
					if (storages[key].data[i].events.length == 0) storages[key].data.splice(i, 1);
				}
			}
			a.download = "chalkboard.json";
			let blob = new Blob([JSON.stringify(storages)], { type: "application/json" });
			a.href = window.URL.createObjectURL(blob);
		} catch (error) {
			a.innerHTML += " ( " + error + " )";
		}
		a.click();
		document.body.removeChild(a);
	}

	function getStoragesAsObj( indices, key ) {
		if (!indices) indices = slideIndices;
		if (!key) key = currentKey;
		let data_ = [];
		for (let i = 0; i < storages[key].data.length; i++) {
			if (storages[key].data[i].slide.h === indices.h && storages[key].data[i].slide.v === indices.v) {
				data_ = storages[key].data[i];
				return data_;
			}
		}
		storages[key].data.push({ slide: indices, events: []});
		data_ = storages[key].data[storages[key].data.length - 1];
		return data_;
	}

	function setDrawingParameters(pointer, context, from, to, color=null){
		context.lineWidth = pointer.lineWidth;
		context.lineCap = "round";
		context.strokeStyle = color == null ? pointer.color : color;
		context.beginPath();
		context.moveTo(from.x, from.y);
		context.lineTo(to.x, to.y);
		context.stroke();
	}

	function drawWithBoardmarker(context, from, to) {
		setDrawingParameters(pointers.marker, context, from, to);
	}

	function drawWithChalk(context, from, to, color=null) {

		setDrawingParameters(pointers.chalk, context, from, to, color);

		let opacity = 1.0;
		context.strokeStyle = context.strokeStyle.replace(/[\d\.]+\)$/g, opacity + ' )' );

		// Chalk Effect
		let length = Math.round(Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)) / (5 / pointers.chalk.lineWidth));
		let unit = calculateVectorNonScaled(from, to, length);

		for (let i = 0; i < length; i++) {
			if (pointers.chalk.effect > (Math.random() * 0.9)) {
				let current = {x: from.x + (i * unit.x), y: from.y + (i * unit.y)};
				let randWidthX = current.x + (Math.random() - 0.5) * pointers.chalk.lineWidth;
				let randWidthY = current.y + (Math.random() - 0.5) * pointers.chalk.lineWidth;
				context.clearRect(randWidthX, randWidthY, Math.random() * 2 + 2, Math.random() + 1);
			}
		}
	}

	function eraseWithEraser(context, x, y) {

		let radius = pointers["eraser"].radius;

		context.save();
		context.beginPath();
		context.arc(x, y, radius, 0, 2 * Math.PI, false);
		context.clip();
		context.clearRect(x - radius - 1, y - radius - 1, radius * 2 + 2, radius * 2 + 2);
		context.restore();
	}

	function clearCanvases(keys) {
		for (let i = 0; i < keys.length; i++) {
			let key = keys[i];
			if ( key == "marker" ) clearTimeout(timerID4slideChanged);
			pointers[key].canvas.context.clearRect(0, 0, pointers[key].canvas.width, pointers[key].canvas.height);
		}
	}


	function recordEvent(data) {
		let storageData = getStoragesAsObj();
		if(data != undefined)
			storageData.events.push(data);
	}


	function startReplay(key) {

		currentKey = "marker";

		for ( key in pointers) {
			clearCanvases([key]);
			let storageData = getStoragesAsObj(slideIndices, key);
			let index = 0;
			while (index < storageData.events.length) {
				replayActions( key, storageData.events[index]);
				index++;
			}
		}
	};

	function replayActions( key, e) {
			if(e.type == "clear") 				clearCanvases([key]);
			else if(e.type == actionType.draw) 	drawCurve( key, e);
			else if(e.type == actionType.setColor && e.hsl != undefined) setColor2Pens(e.hsl);
			else if(e.type == actionType.erase) eraseCurve( key, e);
			else{}
	}

	function drawCurve( key, e) {
		if (e.curve.length > 1) {
			let ctx = pointers[key].canvas.context;
			let {scale, offset} = setScaleOffset(pointers[key]);

			for (let i = 1; i < e.curve.length; i++) {
				let from = calculateAdjustedVector(scale, e.curve[i - 1], offset);
				let to = calculateAdjustedVector(scale, e.curve[i], offset);

				if ( key == "marker" )	drawWithBoardmarker(ctx, from, to);
				else if ( key == "chalk" )	drawWithChalk(ctx, from, to);
				else{}
			}
		}

	};

	function eraseCurve( key, e) {
		if (e.curve.length > 1) {
			let ctx = pointers[key].canvas.context;
			let {scale, offset} = setScaleOffset(pointers[key]);

			for (let i = 0; i < e.curve.length; i++) {
				let vector = calculateAdjustedVector(scale, e.curve[i], offset);
				eraseWithEraser(ctx, vector.x, vector.y);
			}
		}
	};



	function chooseDrawErase(pointer, e) {
		console.log( "Choosing an action" )

		let {scale, offset} = setScaleOffset(pointer);

		assignVector(e,mouse);
		let adjusted = calculateVectorNonScaled(offset, mouse, scale);

		if ((e.button == 2 || e.button == 1) || pointers["eraser"].visibility == "visible") {	//1 = middle, 2 = right buton.
			action = { type: actionType.erase, curve: [{ x: adjusted.x, y: adjusted.y }] };
		}
		else if (e.button == 0) {
			recordEvent({ type: actionType.setColor,hsl: pointer.color});
			action = { type: actionType.draw, curve: [{ x: adjusted.x, y: adjusted.y }] };
		}
		else{}
		assignVector(mouse,last);

	}


	function actionBasedOnEvent(coordinate, pointer, e) {
		let ctx = pointer.canvas.context;
		let {scale, offset} = setScaleOffset(pointer);
		let xy = { x: coordinate.x, y: coordinate.y };
		e.curve.push(xy);
		let lower = calculateAdjustedVector(scale, xy, offset) //{x: x * scale + offset.x, y: y * scale + offset.y};

		//If cursoe is in canvas.
		if (( lower.y > 0 && lower.y < pointer.canvas.height) && ( lower.x > 0 && lower.x < pointer.canvas.width)) {
			if (e.type == actionType.erase) {
				eraseWithEraser(ctx, lower.x, lower.y);
			}
			else if (e.type == actionType.draw){
				if (currentKey == "marker" ) drawWithBoardmarker(ctx, last, lower);
				else if (currentKey == "chalk" ) drawWithChalk(ctx, last, lower);
				else { }
			}
			else {}
			assignVector(lower, last);			

		}
	}

	function stopDrawing() {
		if (action.type == actionType.erase || action.curve.length > 1) recordEvent(action);
		action = null;
	}

	document.addEventListener( 'pointerdown', function (e) {
		let val = e.target.getAttribute( 'data-handwriting' );
		if ( val == currentKey) {
			chooseDrawErase(pointers[currentKey], e);
		}
	});


	document.addEventListener( 'pointermove', function (e) {
		if (action) {
			let {scale, offset} = setScaleOffset(pointers[currentKey]);
			assignVector(e, mouse);			
			let adjusted = calculateVectorNonScaled(offset, mouse, scale);

			actionBasedOnEvent(adjusted, pointers[currentKey],action);
		}
	});

	document.addEventListener( 'pointerup', function (e) {
		if (action) stopDrawing();
	});

	window.addEventListener( "resize", function () {
		
		for ( key in pointers) {
			setWindowParameter(pointers[key], storages[key]);
		}
		startReplay(currentKey);
	});

	Reveal.addEventListener( 'slidechanged', function (e) {
		clearTimeout(timerID4slideChanged);
		console.log( 'slidechanged' );

		slideIndices = Reveal.getIndices();
		// closeCanvas();
		for (key in pointers){
			if(pointers[key].canvas.container.classList.contains( 'visible' )){
				toggleCanvas(key);
 			}
		}
		clearCanvases(["marker", "chalk"]);
		timerID4slideChanged = setTimeout(startReplay, 500, 0);
		
	});

	function toggleCanvas(key){
		pointers["eraser"].visibility = "hidden"; // make sure that the eraser from touch events is hidden
		pointers[key].canvas.container.classList.toggle( 'visible' );

		replaceIconOnEditing(key, iconEditing);
		slideIcon(key);
		
		let canvas = document.getElementById(pointers[key].canvas.name);

		let syle_eraser = document.getElementById("toggle-eraser").style;
		
		if (!pointers[key].canvas.container.classList.contains( 'visible' )) {
			for (k in pointers) {
				pointers[k].color_alpha = 1.0;
				document.getElementById("toggle-" + k).style.pointerEvents = 'auto';
			}
			setColor2Pens();
			action = null;
			if (key == "marker" || key == "chalk") canvas.style.pointerEvents = "none";
			syle_eraser.visibility = "hidden";
		}
		else {
			for (k in pointers) {
				if (k == key || k == "eraser") { 
					pointers[k].color_alpha = 1.0;
				}
				else {
					pointers[k].color_alpha = 0.3;
					document.getElementById("toggle-" + k).style.pointerEvents = 'none';
				}
			}
			setColor2Pens();
			// document.getElementsByClassName(icons['chalk'])[0].style.color = setHSLa(0.1);

			if (key == "marker" || key == "chalk") canvas.style.pointerEvents = "auto";

			document.getElementById("toggle-" + key).style.visibility = "visible";

			currentKey = key;
			syle_eraser.visibility = "visible";
			syle_eraser.left = pointers["eraser"].button.left;
		}		
	}

	function resetIcon(icons, editingIcon){
		for (iconKey in icons){
			let target = document.getElementsByClassName(icons[iconKey]);
			for (let i = 0; i < target.length; i++) {
				target[i].classList.remove(editingIcon);
			}
		}

	}
	
	function replaceIconOnEditing(key, toggledClass='fa-user-edit'){
		let elem = document.getElementById( "toggle-" + key);
		let target = elem.getElementsByClassName( icons[key] )[0].classList.toggle(toggledClass);
		// for (let i = 0; i < target.length; i++) {
		// 	target[i].classList.toggle(toggledClass);
		// }
	}

	function slideIcon(key){
		let target = document.getElementById("toggle-" + key);
		let left = parseInt(target.style.left, 10);
		let offset = left == parseInt(pointers[key].button.left, 10) ? 10 : -10;
		target.style.left = String(left + offset) + "px";
	}
	
	
	function toggleNotesCanvas() {
		toggleCanvas("marker");
		if("chalk" in pointers){
			if(pointers["chalk"].canvas.container.classList.contains( 'visible' )){
				toggleCanvas("chalk");
			}
		}
	}

	function toggleChalkboard() {
		toggleCanvas("chalk");
		if("marker" in pointers){
			if(pointers["marker"].canvas.container.classList.contains( 'visible' )){
				toggleCanvas("marker");
			}
		}

	}

	function toggleraser() {
		pointers["eraser"].visibility = pointers["eraser"].visibility == "hidden" ? "visible" : "hidden";
		slideIcon("eraser");
	}

	function closeCanvas() {
		for ( key in pointers ) {
			pointers[key].canvas.container.classList.remove( 'visible' );
		}
		resetIcon(icons, iconEditing);

		document.getElementById(pointers.chalk.canvas.name).style.pointerEvents = "auto"
		document.getElementById(pointers.marker.canvas.name).style.pointerEvents = "auto";
		currentKey = "marker";
	};


	function clear() {
		recordEvent({ type: "clear" });
		clearCanvases([currentKey]);

	};

	function cycleColor(rotDirection = 1) {	// -1 or 1
		gHSLA.hue = (gHSLA.hue + rotDirection * 60) % 360;
		gHSLA.saturation = gHSLA.hue != 60 ? 66 : 0;

		return gHSLA.hue;
	}

	function colorCycle(direction) {
		cycleColor(direction);
		let color = setColor2Pens();
		recordEvent({ type: actionType.setColor,hsl: color});
	}

	function resetSlide(force) {
		let confirmed = force || confirm( "Want to delete all drawings on this slide?" );
		if (confirmed) {
			action = null;

			clearCanvases(["marker", "chalk"]);

			for (key in pointers){
				let storageData = getStoragesAsObj(key=key);
				storageData.events = [];
			}
		}
	}

	function resetStorage(force) {
		let confirmed = force || confirm( "Want to delete all drawings?" );
		if (confirmed) {
			clearCanvases(["marker", "chalk"]);
			storages = resetStorages()
		}
	}

	this.drawWithBoardmarker = drawWithBoardmarker;
	this.drawWithChalk = drawWithChalk;
	this.toggleNotesCanvas = toggleNotesCanvas;
	this.toggleChalkboard = toggleChalkboard;
	this.toggleraser = toggleraser;
	this.clear = clear;
	this.colorCycle = colorCycle;
	this.reset = resetSlide;
	this.resetAll = resetStorage;
	this.download = downloadJSON;
	this.configure = configure;

	return this;
})();
