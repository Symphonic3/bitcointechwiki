/*
 * bitcointech.wiki transaction editor - a second-generation, visual bitcoin transaction editor
 * Copyright (C) 2023  Symphonic
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

let chainparams = [
	
	{
		id: "Mainnet",
		symbol: "\u20bf",
		p2shprefix: "3",
		bech: "bc",
		p2pkhprefixes: ["1"],
		bnet: bitcoin.networks.bitcoin,
		endpoint: "mempool.space",
		endpointnetwork: "mainnet"
	},
	{
		id: "Testnet",
		symbol: "testnet",
		p2shprefix: "2",
		bech: "tb",
		p2pkhprefixes: ["m","n"],
		bnet: bitcoin.networks.testnet,
		endpoint: "mempool.space",
		endpointnetwork: "testnet"
		
	},
	{
		id: "Signet",
		symbol: "signet",
		p2shprefix: "2",
		bech: "tb",
		p2pkhprefixes: ["m","n"],
		bnet: bitcoin.networks.testnet,
		endpoint: "mempool.space",
		endpointnetwork: "signet"
		
	},
	/*{
		id: "Regtest",
		symbol: "regtest",
		p2shprefix: "2",
		bech: "tb",
		p2pkhprefixes: ["m","n"],
		bnet: bitcoin.networks.regtest,
		endpoint: YOUR REGTEST MEMPOOL.SPACE NODE,
		endpointnetwork: "testnet"
		
	}*/

];

let selchain = chainparams[0];

Array.prototype.remove = function() {
	let pn = false;
	var what, a = arguments,
		L = a.length,
		ax;
	while (L && this.length) {
		what = a[--L];
		while ((ax = this.indexOf(what)) !== -1) {
			pn = true;
			this.splice(ax, 1);
		}
	}
	return pn;
};

let uielements = [];

class Point {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
}

class Colors {

	constructor(normalcolor, lightcolor, darkcolor) {

		this.normalcolor = normalcolor;
		this.lightcolor = lightcolor;
		this.darkcolor = darkcolor;

	}

}

let COLOR_PALETTE_GRAY = {};
let COLOR_PALETTE_GREEN = {};
let COLOR_PALETTE_GOLD = {};
let COLOR_PALETTE_PURPLE = {};
let COLOR_PALETTE_RED = {};

function preload() {

	COLOR_PALETTE_GRAY.normalcolor = color(235, 235, 235);
	COLOR_PALETTE_GRAY.lightcolor = color(250, 250, 250);
	COLOR_PALETTE_GRAY.darkcolor = color(200, 200, 200);
	
	COLOR_PALETTE_GREEN.normalcolor = color(164, 235, 181);
	COLOR_PALETTE_GREEN.lightcolor = color(179, 255, 195);
	COLOR_PALETTE_GREEN.darkcolor = color(125, 179, 137);
	
	COLOR_PALETTE_GOLD.normalcolor = color(235, 203, 164);
	COLOR_PALETTE_GOLD.lightcolor = color(255, 220, 179);
	COLOR_PALETTE_GOLD.darkcolor = color(179, 154, 125);
	
	COLOR_PALETTE_PURPLE.normalcolor = color(164, 192, 235);
	COLOR_PALETTE_PURPLE.lightcolor = color(179, 209, 255);
	COLOR_PALETTE_PURPLE.darkcolor = color(125, 146, 179);
	
	COLOR_PALETTE_RED.normalcolor = color(235, 171, 164);
	COLOR_PALETTE_RED.lightcolor = color(255, 186, 179);
	COLOR_PALETTE_RED.darkcolor = color(179, 130, 125);

}

const SATS_PER_COIN = 100000000; //ONE HUNDRED MILLION
const EMPTY_WITNESS_ITEM = "[EMPTY ITEM]";

let canvasOrigin;
let spawns = 0;
let canvasSize;
let canvasBounds;

let showfps = false;
function keyPressed() { if (keyCode == 70) { showfps = !showfps; } } //F key

function canvasStepRatioX() {
	return canvasSize.x / width;
}

function canvasStepRatioY() {
	return canvasSize.y / height;
}

let canvas;

function resetCanvasBounds() {
	canvasBounds = new Point(min(window.innerWidth * 0.95, 1300), window.innerHeight * 4 / 5);
}

function windowResized() {
	spawns = 0;
	
	let oldCenOrigin = canvasOrigin;
	oldCenOrigin.x += canvasSize.x/2;
	oldCenOrigin.y += canvasSize.y/2;
	
	let oldCanvasBounds = canvasBounds;
	resetCanvasBounds();
	
	canvasSize.x *= canvasBounds.x/oldCanvasBounds.x;
	canvasSize.y *= canvasBounds.y/oldCanvasBounds.y;

	canvasOrigin.x = oldCenOrigin.x - canvasSize.x/2; //TL
	canvasOrigin.y = oldCenOrigin.y - canvasSize.y/2;
	resizeCanvas(canvasBounds.x, canvasBounds.y);
}

function setup() {
	bitcoin.initEccLib(secp256k1);
	resetCanvasBounds();
	canvasSize = new Point(1200, 1200*canvasBounds.y/canvasBounds.x)
	canvasOrigin = new Point(-canvasSize.x / 2, -canvasSize.y / 2);
	canvas = createCanvas(canvasBounds.x, canvasBounds.y);
	/*uielements.push(
	  new InputOutputDisplayElement(new BoundingBox(new Point(-25, -270), 50, 50))
	); //TEST*/
	let inp = new p5.Element(document.getElementById("loaderinput"));

	function doInput() {
		let input = inp.value();
		inp.value(null);

		if (input.length == 64 && new RegExp("^[a-fA-F0-9]+$").test(input)) { //tx

			getTransactionFull(input).catch((error) => {
				inp.elt.classList.add("error");
			}).then((tx) => {

				uielements.push(new TransactionDisplay(new Point(canvasOrigin.x + canvasSize.x / 2 + (canvasSize.x / 30 * spawns), canvasOrigin.y + canvasSize.y / 2 + (canvasSize.y / 30 * spawns++)), tx, MutabilityType.NONE));
				inp.elt.classList.remove("error");
				
			});


		} else if (input.length >= 66 && new RegExp("^[a-fA-F0-9]+$").test(input.substring(0, 64)) && input.substring(64, 65) == ":") { //utxo

			getUtxo(input.substring(0, 64), input.substring(65, input.length)).catch((error) => {
				inp.elt.classList.add("error");
			}).then((utxo) => {

				uielements.push(
					new UTXODisplay(
						new Point(
							canvasOrigin.x + canvasSize.x / 2 + (canvasSize.x / 30 * spawns),
							canvasOrigin.y + canvasSize.y / 2 + (canvasSize.y / 30 * spawns++)
						), 
						utxo, 
						utxo.status == Status.STATUS_UTXO_SPENDABLE ? MutabilityType.OUTPUTSONLY : MutabilityType.NONE
					)
				);
				inp.elt.classList.remove("error");

			});

		} else { //assumed to be an address		  
			//inp.elt.classList.add("error");

			let utxos = getAddressUtxos(input).catch((error) => {
				inp.elt.classList.add("error");
			}).then((utxos) => {

				let n = utxos.length;

				let sy = (canvasOrigin.y + canvasSize.y / 2);

				for (let i = 0; i < n; i++) {

					let utxo = utxos[i];

					uielements.push(
						new UTXODisplay(
							new Point(
								canvasOrigin.x + canvasSize.x / 2 + (canvasSize.x / 30 * spawns),
								(sy - (n / 2) * 150) + (i * 150) + 30 + (canvasSize.y / 30 * spawns)
							),
							utxo,
							utxo.status == Status.STATUS_UTXO_SPENDABLE ? MutabilityType.OUTPUTSONLY : MutabilityType.NONE
						)
					);

				}

				spawns++;
				
				inp.elt.classList.remove("error");

			});

		}
	}
	inp.elt.addEventListener('keypress', function(e) {
		if (e.key === 'Enter') {
			doInput();
		}
	});
	let addbutton = new p5.Element(document.getElementById("addbtn"));
	addbutton.mouseClicked(function() {
		doInput();
	});
	
	let importtxbutton = new p5.Element(document.getElementById("addimporttx"));
	importtxbutton.mouseClicked(function() {
		let p = prompt("Enter Base64 PSBT");
		if (!p.startsWith("cHNid")) throw new Error("Obviously not PSBT"); //sanity check
		let tx = loadTXPSBT(p);
		let txd = new TransactionDisplay(
			new Point(canvasOrigin.x + canvasSize.x / 2 + (canvasSize.x / 30 * spawns), canvasOrigin.y + canvasSize.y / 2 + (canvasSize.y / 30 * spawns++)),
			tx,
			MutabilityType.ALL
		);
		txd.addButtonPushed(ButtonSide.LEFT, true);
		txd.addButtonPushed(ButtonSide.RIGHT, true);
		uielements.push(txd);
	});
	
	let emptytxbutton = new p5.Element(document.getElementById("addemptytx"));
	emptytxbutton.mouseClicked(function() {
		let tx = new Transaction([], [], 2, 0, Status.STATUS_NEW, -1);
		let txd = new TransactionDisplay(
			new Point(canvasOrigin.x + canvasSize.x / 2 + (canvasSize.x / 30 * spawns), canvasOrigin.y + canvasSize.y / 2 + (canvasSize.y / 30 * spawns++)),
			tx,
			MutabilityType.ALL
		);
		uielements.push(txd);
	});

	let utxoaddressbutton = new p5.Element(document.getElementById("addutxoaddress"));
	utxoaddressbutton.mouseClicked(function() {
		let utx = new UTXO("", 0, Status.STATUS_NEW, -1, null, null, null, new UTXOFullData(), null, null, false, false);
		utx.scriptpubkey = bitcoin.address.toOutputScript(prompt("Enter address:"), selchain.bnet).toString("hex");
		let utxd = new UTXODisplay(
			new Point(canvasOrigin.x + canvasSize.x / 2 + (canvasSize.x / 30 * spawns), canvasOrigin.y + canvasSize.y / 2 + (canvasSize.y / 30 * spawns++)),
			utx,
			MutabilityType.ALL
		);
		uielements.push(utxd);
	});

	let emptyutxobutton = new p5.Element(document.getElementById("addemptyutxo"));
	emptyutxobutton.mouseClicked(function() {
		let utx = new UTXO("", 0, Status.STATUS_NEW, -1, null, null, null, new UTXOFullData(), null, null, false, false);
		let utxd = new UTXODisplay(
			new Point(canvasOrigin.x + canvasSize.x / 2 + (canvasSize.x / 30 * spawns), canvasOrigin.y + canvasSize.y / 2 + (canvasSize.y / 30 * spawns++)),
			utx,
			MutabilityType.ALL
		);
		uielements.push(utxd);
	});
	
	let chainselector = document.getElementById("chainselector");
	chainselector.style.width = "90px";

	for (let i = 0; i < chainparams.length; i++) {
		let option = document.createElement("option");
		option.value = chainparams[i].id;
		option.text = chainparams[i].id;
		chainselector.appendChild(option);
	}

	chainselector.addEventListener("change", function(e) {

		ind = chainselector.selectedIndex;
		
		uielements = [];
		selectedItem = null;
		drag = null;
		hoverElement = null;
		clearTable();
		
		selchain = chainparams[ind];

	});
	
}

//
// VISUAL HELPER FUNCTIONS
//

let hoverElement = null;
let drag = null;
let selectedItem = null;
let loadingSelection = false;
let pMouseIsPressed = false;
let mouseClickedThisFrame = false;
let mouseDroppedThisFrame = false;
let mouseClickedX;
let mouseClickedY;
let _cursorSetFrame = false;
let _titleSetFrame = false;
let mouseInBounds = false;

let _ncursor = null;
let _ntitle = null;

function setCursor(cur) {

	_ncursor = cur;
	_cursorSetFrame = _ncursor != null;

}

function setTitle(title) {

	_ntitle = title;
	_titleSetFrame = _ntitle != null;

}

function clearTable() {

	let table = document.getElementById("dataTable");
	table.innerHTML = "";

}

function insertTableRow(key, value) {

	return insertTableRowEV(key, textAsElement(value));

}

function insertTableRowEV(key, value) {

	let row = document.getElementById("dataTable").insertRow();
	row.insertCell(0).innerHTML = key;
	let c = row.insertCell(1);
	c.appendChild(value);
	return c;

}

let btnHover = false;

let slowFrameRate = 0;
function draw() {
	if (frameCount % 10 == 0) slowFrameRate = frameRate();
	mouseInBounds = (mouseX > 0 && mouseY > 0 && mouseX < width && mouseY < height);

	if (mouseInBounds) {

		mouseClickedThisFrame = (!pMouseIsPressed && mouseIsPressed);
		mouseDroppedThisFrame = (pMouseIsPressed && !mouseIsPressed);

	} else {

		mouseClickedThisFrame = false;
		mouseDroppedThisFrame = pMouseIsPressed;

	}
	_cursorSetFrame = false;
	_titleSetFrame = false;
	if (mouseClickedThisFrame) {
		mouseClickedX = mouseX;
		mouseClickedY = mouseY;
	}
	//utility ^

	background(241);

	let n = width / 20;
	let nr = n * 1.3;
	let pi = new Point(width - n, height - n);

	if ((!mouseIsPressed || mouseClickedThisFrame) && !isPinching) {

		/*//determine plus button
		if ( ( ((mouseX-pi.x)**2) + ((mouseY-pi.y)**2) ) < (nr/2)**2) {
			btnHover = true;
		} else btnHover = false;*/
		//determine hovered element
		hoverElement = null;
		if (drag != null && mouseDroppedThisFrame) drag.drop();
		drag = null;

		if (mouseInBounds) {
			if (!btnHover && !drag) {
				let mCart = realToCart(new Point(mouseX, mouseY));
				for (let i = uielements.length - 1; i >= 0; i--) {
					let celement = uielements[i];
					if (celement.test(mCart)) {
						hoverElement = celement;
						if (mouseIsPressed) {
							uielements.remove(celement);
							uielements.push(celement);
						} else if (keyIsDown(8)) { //backspace
							hoverElement = null;
							uielements.remove(celement);
							celement.onRemoved();
							if (selectedItem == celement) clearTable();
						}
						break;
					}
				}
			}
		}

	}

	if (mouseInBounds && mouseIsPressed && !btnHover && !drag) {
		let deltaX = isPinching ? pinchCenX - prevPinchCenX : mouseX - pmouseX;
		let deltaY = isPinching ? pinchCenY - prevPinchCenY : mouseY - pmouseY;
		
		if ((hoverElement == null || isPinching) && (!isPinching || (prevPinchCenX != Infinity && prevPinchCenY != Infinity))) {
			canvasOrigin.x -= deltaX * canvasStepRatioX();
			canvasOrigin.y -= deltaY * canvasStepRatioY();
			spawns = 0;
		}

	}

	if (
		wheelDelta != 0 &&
		!(canvasSize.x + wheelDelta <= 0 || canvasSize.y + wheelDelta <= 0)
	) {
		
		let useMX = isPinching ? pinchCenX : mouseX;
		let useMY = isPinching ? pinchCenY : mouseY;
		
		//account for aspect ratio of canvas
		let aspect = canvasSize.y / canvasSize.x;
		let nCenter = realToCart(new Point(useMX, useMY));
		let deltaA = ((sqrt((canvasSize.x + canvasSize.y) / 2) + wheelDelta / 25) ** 2 - (canvasSize.x + canvasSize.y) / 2);
		canvasSize.x += deltaA;
		canvasSize.y += deltaA * aspect;
		let newM = realToCart(new Point(useMX, useMY));
		canvasOrigin.x += nCenter.x - newM.x;
		canvasOrigin.y += nCenter.y - newM.y;
		spawns = 0;
	}

	if (mouseDroppedThisFrame) {

		if (mouseX == mouseClickedX && mouseY == mouseClickedY && !loadingSelection) {
			//select ui items
			let nselectedItem;
			if (hoverElement == null) {

				nselectedItem = null;

			} else {

				nselectedItem = hoverElement;

			}

			if (selectedItem != nselectedItem) {

				selectedItem = nselectedItem;
				clearTable();

				if (selectedItem != null) {

					insertTableRow("Loading...", "...");
					selectedItem.onFocused();

				}

			}

		}

	}
	/*if (btnHover){
	  
	setCursor("pointer");
	setTitle("Add...");

	if (mouseClickedThisFrame) {
	  
		//do stuff
	  
	}

  }
  //draw plus button		
  strokeWeight(0);
  fill(btnHover ? (mouseIsPressed ? 210 : 230) : 255);
  circle(pi.x, pi.y, nr);
  fill(67,136,214);
  rect(pi.x - nr/4, pi.y - nr/16, nr/2, nr/8);
  rect(pi.x - nr/16, pi.y - nr/4, nr/8, nr/2);*/

	fill(225);
	strokeWeight(0);
	textSize(200 / canvasStepRatioX());
	textAlign(CENTER, CENTER);
	let pp = cartToReal(new Point(0, 0));
	text(selchain.symbol, pp.x, pp.y);

	//use a seperate layer for this bezier line drawing and do it in a different place?
	for (let i = 0; i < uielements.length; i++) {
		let celement = uielements[i];
		inner: for (let j = 0; j < celement.leftPlugs.length; j++) { //arbitrary but will always cover everything exactly once

			let ctnc = celement.leftPlugs[j];
			if (!ctnc.fullyConnected()) continue inner;

			let o = ctnc.right;
			let vPos = new BoundingBox(
				new Point(
					o.getBounds().pos.x,
					o.getBounds().pos.y + o.topOffset + o.rowHeight * j + (o.rowMargin * j)
				),
				o.rowWidth,
				o.rowHeight
			);
			let doP = cartToReal(vPos.pos);

			let thisCenX = doP.x + (vPos.width / canvasStepRatioX()) / 2;
			thisCenX += -(vPos.width / canvasStepRatioX()) / 2;
			let thisCenY = doP.y + (vPos.height / canvasStepRatioY()) / 2;

			let o2 = ctnc.left;
			let vPos2 = new BoundingBox(
				new Point(
					o2.getBounds().pos.x + (o2.getBounds().width - o2.rowWidth),
					o2.getBounds().pos.y + o2.topOffset + o2.rowHeight * o2.rightPlugs.indexOf(ctnc) + (o2.rowMargin * o2.rightPlugs.indexOf(ctnc))
				),
				o2.rowWidth,
				o2.rowHeight
			);
			let doP2 = cartToReal(vPos2.pos);

			let thatCenX = doP2.x + (vPos2.width / canvasStepRatioX()) / 2;
			thatCenX += (vPos2.width / canvasStepRatioX()) / 2;
			let thatCenY = doP2.y + (vPos2.height / canvasStepRatioY()) / 2;

			drawBezier(thisCenX, thisCenY, thatCenX, thatCenY);

		}

	}

	for (let i = 0; i < uielements.length; i++) {
		let celement = uielements[i];
		celement.render();
	}

	if (drag != null && !isPinching) {

		setCursor("grabbing");
		drag.drag();

	}
	
	if (showfps) {
		fill(0);
		strokeWeight(0);
		textSize(20);
		textAlign(LEFT, TOP);
		text("(F) to hide, fps: " + round(slowFrameRate), 0, 0);
	}

	//utility

	if (!_cursorSetFrame) setCursor(mouseIsPressed ? "grabbing" : "move");
	if (!_titleSetFrame) setTitle(null);

	cursor(_ncursor == null ? "auto" : _ncursor);
	if (_ntitle == null) canvas.elt.removeAttribute("title");
	else canvas.elt.title = _ntitle;

	pMouseIsPressed = mouseIsPressed;
	wheelDelta = 0;
}

//
// drawing
//

function drawPlug(x, y, width, height, side, withPlus) {

	if (side == ButtonSide.LEFT) {

		beginShape();
		vertex(x, y);
		vertex(x + width * 2 / 3, y);
		vertex(x + width, y + height / 2);
		vertex(x + width * 2 / 3, y + height);
		vertex(x, y + height);
		endShape(CLOSE);

	} else {

		beginShape();
		vertex(x + width, y);
		vertex(x + width / 3, y);
		vertex(x, y + height / 2);
		vertex(x + width / 3, y + height);
		vertex(x + width, y + height);
		endShape(CLOSE);

	}

	if (withPlus) {

		//line(x1, y + height/4, x1 + width*0.5, y + height*3/4);
		let x2 = x + width * (side ? 1 / 3 : 0) + width * 1 / 8 + width * (side ? -0.1 : 0.1);
		let w = width * 0.4;
		line(x2, y + height / 2, x2 + w, y + height / 2);

		let x3 = x2 + w / 2;
		line(x3, y + height / 2 - w / 2, x3, y + height / 2 + w / 2);

	}

}

function drawBezier(thisCenX, thisCenY, thatCenX, thatCenY, opacity = 255) {

	strokeWeight(4 / canvasStepRatioY());
	stroke(0, 0, 0, opacity);
	noFill();
	beginShape();
	vertex(thisCenX, thisCenY);
	vertex(thisCenX, thisCenY);
	bezierVertex(thisCenX + (thatCenX - thisCenX) / 2, thisCenY, thisCenX + (thatCenX - thisCenX) / 2, thatCenY, thatCenX, thatCenY);
	vertex(thatCenX, thatCenY)
	endShape();

}

//
// BITCOIN DATA STRUCTURES
//

const Status = {

	STATUS_CONFIRMED: { colors: COLOR_PALETTE_GREEN, desc: "SPENT", desctx: "CONFIRMED" },
	STATUS_MEMPOOL_UNCONFIRMED: { colors: COLOR_PALETTE_PURPLE, desc: "SPENT (MEMPOOL)", desctx: "MEMPOOL" },
	STATUS_NEW: { colors: COLOR_PALETTE_GRAY, desc: "NEW", desctx: "NEW" },
	STATUS_COIN_SPENDABLE: { colors: COLOR_PALETTE_GOLD, desc: "AVAILABLE" },
	STATUS_COIN_DETACHED: { colors: COLOR_PALETTE_RED, desc: "DETACHED" },

}

class Transaction {

	constructor(vin, vout, version, locktime, status, confblock = -1) {

		this.inputs = vin; //UTXO []
		this.outputs = vout; //UTXO []
		this.version = version;
		this.locktime = locktime;

		this.status = status;
		this.confblock = confblock;

	}

	getBitcoin(rate = true) {

		let btx = new bitcoin.Transaction();
		btx.locktime = this.locktime;
		btx.version = this.version;
		for (let i = 0; i < this.inputs.length; i++) {

			let ss = undefined;

			try {
				btx.addInput(
					Buffer.from(this.inputs[i].getTXID(), 'hex').reverse(),
					this.inputs[i].getOutpoint(),
					this.inputs[i].fullData.sequence,
					ss
				);
			} catch (e) {
				print(this.inputs[i]);
			}
			if (this.inputs[i].fullData.scriptsig) btx.setInputScript(i, Buffer.from(this.inputs[i].fullData.scriptsig, 'hex'));
			if (this.inputs[i].fullData.witness && this.inputs[i].fullData.witness.length > 0) btx.setWitness(i, this.inputs[i].fullData.witness.map(x => Buffer.from(x, 'hex')));

		}
		for (let i = 0; i < this.outputs.length; i++) {

			btx.addOutput(Buffer.from(this.outputs[i].scriptpubkey, 'hex'), rate ? this.outputs[i].getValue() : 0);

		}
		return btx;

	}

	async getPsbt() {

		let btx = this.getBitcoin();
		let psbt = new bitcoin.Psbt({network: selchain.bnet});

		psbt.setVersion(this.version);
		psbt.setLocktime(this.locktime);

		for (let i = 0; i < btx.outs.length; i++) {

			psbt.addOutput(btx.outs[i]);

		}

		for (let i = 0; i < this.inputs.length; i++) {

			psbt.addInput({

				hash: this.inputs[i].getTXID(),
				index: this.inputs[i].getOutpoint()

			});
			psbt.setInputSequence(i, this.inputs[i].fullData.sequence);

		}

		for (let i = 0; i < this.inputs.length; i++) {
			
			if (this.inputs[i].iscoinbase) return "!COINBASE!";
			let txe = (await this.inputs[i].getTransaction());
			if (txe.inputs.length != 0) {

				psbt.updateInput(i, {

					nonWitnessUtxo: txe.getBitcoin().toBuffer()

				});
				if (this.inputs[i].fullData.scriptsig || (this.inputs[i].fullData.witness && this.inputs[i].fullData.witness.length > 0)) {

					let thiso = this;
					psbt.finalizeInput(i, function() {

						return {

							finalScriptSig: thiso.inputs[i].fullData.scriptsig ? Buffer.from(thiso.inputs[i].fullData.scriptsig, 'hex') : Buffer.from("", 'hex'),
							finalScriptWitness: (thiso.inputs[i].fullData.witness && thiso.inputs[i].fullData.witness.length > 0) ? bitcoin.Psbt.witnessStackToScriptWitness(thiso.inputs[i].fullData.witness.map(x => Buffer.from(x, 'hex'))) : undefined

						};

					});

				}

			}

		}

		return psbt.toBase64();

	}


	getInAmt() {
		let a = 0;
		for (let i = 0; i < this.inputs.length; i++) {
			a += this.inputs[i].getValue();
		}
		return a;
	}

	getOutAmt(ignore = null) {
		let a = 0;
		for (let i = 0; i < this.outputs.length; i++) {
			if (this.outputs[i] != ignore) a += this.outputs[i].getValue();
		}
		return a;
	}

}

class UTXOFullData {

	constructor(scriptsig = "", sequence = 4294967293, witness = []) {

		this.scriptsig = scriptsig;
		this.sequence = sequence;
		this.witness = witness;

	}

	isRBFSelf() {

		return this.sequence < 4294967294;

	}

	isFlaggingDisableLocktimeSelf() {

		return this.sequence == 4294967295;

	}

}

class UTXO {

	constructor(scriptpubkey, value, status, confblock = -1, txid = null, outpoint = null, spendertxid = null, fullData = null, tx = null, spendertx = null, loadablespender = true, iscoinbase = false) {

		this.scriptpubkey = scriptpubkey; //hex
		this.value = value;

		this.status = status;
		this.confblock = confblock;

		this.txid = txid;
		this.outpoint = outpoint;
		this.spendertxid = spendertxid;

		this.fullData = fullData;

		this.tx = tx;

		this.spendertx = spendertx;
		this.loadablespender = loadablespender;
		
		this.iscoinbase = iscoinbase;

	}

	getTXID() {
		if (this.tx) return this.tx.getBitcoin().getId();
		else return this.txid;
	}

	getOutpoint() {
		if (this.outpoint != null) return this.outpoint;
		else if (this.tx) return this.tx.outputs.indexOf(this);
		else return -1;
	}

	getSpenderTXID() {
		if (this.spendertx) return this.spendertx.getBitcoin().getId();
		else return this.spendertxid;
	}

	getValue() {
		if (!this.remaindervalue) return this.value;
		else {
			if (this.remaindervalue) {
				if (this.tx) {
					let tx = this.tx;
					let cf = tx.customfee;
					let nfee = 0;
					if (cf) {
						if (cf.value != undefined) {
							nfee = cf.value;
						} else if (cf.rate != undefined) {
							nfee = cf.rate * (tx.getBitcoin(false).weight() / 4)
						}
						nfee = ceil(nfee);
						let sthis = false;
						for (let i = 0; i < tx.outputs.length; i++) {
							if (tx.outputs[i] == this){
								sthis = true;
								continue;
							}
							if (sthis && tx.outputs[i].remaindervalue) return 0;
						}
						let nothers = tx.getInAmt() - tx.getOutAmt(this);
						let fret = nothers - nfee;
						return max(fret, 0);
					} else {
						return 0;
					}
				} else {
					return 0;
				}
			}
		}
	}

	async loadAllData() {

		if (!this.loadablespender) return;
		if (this.fullData != null) return;
		await this.getSpenderTransaction(); //will load data itself (efficiency)

	}

	async getTransaction() {

		if (this.tx) return this.tx;
		if (this.iscoinbase) throw new Error("Attempting to load creator of coinbase utxo!");
		this.tx = await getTransactionFull(this.txid);
		return this.tx;

	}

	async getSpenderTransaction() {

		if (this.spendertx) return this.spendertx;

		this.spendertx = await getTransactionFull(this.spendertxid);

		if (this.fullData == null) {

			let p = this.spendertx.inputs.find(e => (e.txid == this.txid && e.outpoint == this.outpoint));

			if (p) {

				this.fullData = new UTXOFullData(p.fullData.scriptsig, p.fullData.sequence, p.fullData.witness); //duplication

			}

		}

		return this.spendertx;

	}

	getAddress() {
		
		if (this.scriptpubkey.startsWith("6a")) { //OP_RETURN
			
			return bitcoin.script.toASM(Buffer.from(this.scriptpubkey, 'hex'));
			
		} else {
			
			let raw = Buffer.from(this.scriptpubkey, 'hex');

			try {

				return bitcoin.address.fromOutputScript(raw, selchain.bnet);

			} catch (e) {

				return "NONSTANDARD";

			}
			
		}

	}

}

//
// BitcoinJS tx loading
//

function loadTXPSBT(rawpsbt) {
	
	let psbt = bitcoin.Psbt.fromBase64(rawpsbt);
	let btx = psbt.extractTransaction();
	
	let tx = new Transaction([], [], btx.version, btx.locktime, Status.STATUS_NEW, -1);

	for (let i = 0; i < btx.ins.length; i++) {

		let utxfd = new UTXOFullData(btx.ins[i].script, btx.ins[i].sequence, btx.ins[i].witness.map(x => x.toString("hex")) );

		if (btx.isCoinbase()) {
			let valsum = 0;
			for (let i = 0; i < btx.outs.length; i++) valsum += btx.outs[i].value;
			tx.inputs.push(
				new UTXO(
					"",
					valsum,
					Status.STATUS_COIN_DETACHED,
					-1,
					Buffer.from(btx.ins[i].hash.toString("hex"), "hex").reverse().toString("hex"),
					btx.ins[i].index,
					null,
					utxfd,
					null,
					tx,
					false,
					true
				)
			);
		} else {
			let inScriptPubkey;
			let inValue;
			if (psbt.data.inputs[i].nonWitnessUtxo && psbt.data.inputs[i].nonWitnessUtxo.length > 0) {
				let previn = bitcoin.Transaction.fromBuffer(psbt.data.inputs[i].nonWitnessUtxo);
				inScriptPubkey = previn.outs[btx.ins[i].index].script.toString("hex");
				inValue = previn.outs[btx.ins[i].index].value;
			} else {
				inScriptPubkey = "";
				inValue = 0;
			}
			tx.inputs.push(
				new UTXO(
					inScriptPubkey,
					inValue,
					Status.STATUS_COIN_DETACHED,
					-1,
					Buffer.from(btx.ins[i].hash.toString("hex"), "hex").reverse().toString("hex"),
					btx.ins[i].index,
					null,
					utxfd,
					null,
					tx,
					false,
					false
				)
			);
		}
		
	}

	for (let i = 0; i < btx.outs.length; i++) {

		let utxfd = new UTXOFullData();

		tx.outputs.push(new UTXO(btx.outs[i].script.toString("hex"), btx.outs[i].value, Status.STATUS_NEW, -1, null, null, null, utxfd, tx, null, false, false));

	}
	
	return tx;

}

//
// BITCOIN MEMPOOL.SPACE API HELPERS
//

async function getAddressUtxos(address) { //TODO bad, should not just load everything you tell it to

	const {
		bitcoin: {
			addresses
		}
	} = mempoolJS({
		hostname: selchain.endpoint,
		network: selchain.endpointnetwork
	});

	let utxs = await addresses.getAddressTxsUtxo({
		address
	});

	let promises = [];

	for (let i = 0; i < utxs.length; i++) {

		promises.push(getUtxo(utxs[i].txid, utxs[i].vout));

	}

	let utxDatas = await Promise.all(promises);

	return utxDatas;

}

async function getUtxo(txid, outpoint) {

	let tx = await getTransactionFull(txid);
	if (tx.outputs.length <= outpoint) throw new Error("Invalid tx outpoint");
	return tx.outputs[outpoint]; //not fully loaded

}

async function getTransactionFull(txid) {

	const {
		bitcoin: {
			transactions
		}
	} = mempoolJS({
		hostname: selchain.endpoint,
		network: selchain.endpointnetwork
	});

	let [tx, outsp] = await Promise.all([
		getTransactionOnlyData(txid),
		transactions.getTxOutspends({
			txid
		}).catch((error => {
			throw new Error("Could not load outspends: " + txid);
		}))
	]);

	let ins = [];
	for (let i = 0; i < tx.vin.length; i++) {

		let utxfd = new UTXOFullData(tx.vin[i].scriptsig, tx.vin[i].sequence, tx.vin[i].witness != undefined ? tx.vin[i].witness : []);

		if (tx.vin[i].is_coinbase) {
			let valsum = 0;
			for (let i = 0; i < tx.vout.length; i++) valsum += tx.vout[i].value;
			ins.push(
				new UTXO(
					"",
					valsum,
					tx.status.confirmed ? Status.STATUS_CONFIRMED : Status.STATUS_MEMPOOL_UNCONFIRMED,
					tx.status.confirmed ? tx.status.block_height : -1,
					tx.vin[i].txid,
					tx.vin[i].vout,
					txid,
					utxfd,
					null,
					null,
					false,
					true
				)
			);
		} else {
			ins.push(
				new UTXO(
					tx.vin[i].prevout.scriptpubkey,
					tx.vin[i].prevout.value,
					tx.status.confirmed ? Status.STATUS_CONFIRMED : Status.STATUS_MEMPOOL_UNCONFIRMED,
					tx.status.confirmed ? tx.status.block_height : -1,
					tx.vin[i].txid,
					tx.vin[i].vout,
					txid,
					utxfd
				)
			);
		}
		


	}

	let outs = [];
	for (let i = 0; i < tx.vout.length; i++) {

		let utxfd = outsp[i].spent ? undefined : new UTXOFullData();

		outs.push(new UTXO(
			tx.vout[i].scriptpubkey,
			tx.vout[i].value,
			outsp[i].spent ? (outsp[i].status.confirmed ? Status.STATUS_CONFIRMED : Status.STATUS_MEMPOOL_UNCONFIRMED) : Status.STATUS_COIN_SPENDABLE,
			(outsp[i].spent && outsp[i].status.confirmed) ? outsp[i].status.block_height : -1,
			txid,
			i,
			outsp[i].txid,
			utxfd
		));

	}

	return new Transaction(ins, outs, tx.version, tx.locktime, tx.status.confirmed ? Status.STATUS_CONFIRMED : Status.STATUS_MEMPOOL_UNCONFIRMED, tx.status.confirmed ? tx.status.block_height : -1);

}

async function getTransactionOnlyData(txid) {

	const {
		bitcoin: {
			transactions
		}
	} = mempoolJS({
		hostname: selchain.endpoint,
		network: selchain.endpointnetwork
	});

	return await transactions.getTx({
		txid
	}).catch((error) => {
		throw new Error("Could not load tx: " + txid);
	});

}

//
// HELPER FUNCTIONS
// 

function cartToReal(pos) {
	let x = (pos.x - canvasOrigin.x) / canvasStepRatioX();
	let y = (pos.y - canvasOrigin.y) / canvasStepRatioY();

	return new Point(x, y);
}

function realToCart(pos) {
	let x = pos.x * canvasStepRatioX() + canvasOrigin.x;
	let y = pos.y * canvasStepRatioY() + canvasOrigin.y;

	return new Point(x, y);
}

function pointInBox(point, box) {

	return (point.x > box.pos.x &&
		point.y > box.pos.y &&
		point.x < box.pos.x + box.width &&
		point.y < box.pos.y + box.height);

}

function nFormatter(num, digits) {
	const lookup = [{
			value: 1,
			symbol: ""
		},
		{
			value: 1e3,
			symbol: "k"
		},
		{
			value: 1e6,
			symbol: "M"
		},
		{
			value: 1e9,
			symbol: "G"
		},
		{
			value: 1e12,
			symbol: "T"
		},
		{
			value: 1e15,
			symbol: "P"
		},
		{
			value: 1e18,
			symbol: "E"
		}
	];
	const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
	var item = lookup.slice().reverse().find(function(item) {
		return num >= item.value;
	});
	return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
}

function satsAsBitcoin(n) {

	return (n / SATS_PER_COIN).toFixed(8);

}

function getAddressType(address) {
	
	if (address.startsWith("OP_RETURN ")) return "data";
	if (address.length >= 26 && address.length <= 35 && selchain.p2pkhprefixes.includes(address.substring(0, 1))) return "p2pkh";
	if (address.length >= 26 && address.length <= 35 && address.startsWith(selchain.p2shprefix)) return "p2sh";
	if (address.length == 62 && address.startsWith(selchain.bech + "1q")) return "p2wsh";
	if (address.length == 42 && address.startsWith(selchain.bech + "1q")) return "p2wpkh";
	if (address.startsWith(selchain.bech + "1p")) return "p2tr";
	return "Unknown";

}

//
// EVENTS
//

let wheelDelta = 0;
let fingerDist = 0;

let isPinching = false; //used to suppress motion and create custom offset

let pinchCenX = Infinity;
let pinchCenY = Infinity;

let prevPinchCenX = Infinity;
let prevPinchCenY = Infinity;

function mouseWheel(event) {
	if (mouseInBounds && keyIsDown(SHIFT)) {
		wheelDelta += event.delta;
		return false;
	} else {
		return true;
	}
}

function getPinchDistance(e) {
	let delX = e.touches[0].clientX - e.touches[1].clientX;
	let delY = e.touches[0].clientY - e.touches[1].clientY;
	return Math.sqrt(delX**2 + delY**2);
}

document.addEventListener('touchstart', function (e) {
	if (e.touches.length == 2) { //2 touches = pinch zoom
		e.preventDefault();
		isPinching = true;
		fingerDist = getPinchDistance(e);
	}
}, false);

document.addEventListener('touchmove', function (e) {
	if (e.touches.length == 2) { // If pinch-zooming
		e.preventDefault();
		isPinching = true;
		let newFingDist = getPinchDistance(e);
		prevPinchCenX = pinchCenX;
		prevPinchCenY = pinchCenY;
		pinchCenX = mouseX + ((e.touches[1].clientX - e.touches[0].clientX)/2);
		pinchCenY = mouseY + ((e.touches[1].clientY - e.touches[0].clientY)/2);
		wheelDelta += (abs(fingerDist / newFingDist) - 1)*25*15;
		fingerDist = newFingDist;
	}
}, false);

document.addEventListener('touchend', function (e) {
	fingerDist = 0;
	pinchCenX = Infinity;
	pinchCenY = Infinity;
	prevPinchCenX = Infinity;
	prevPinchCenY = Infinity;
    isPinching = false;
}, false);

//
// UI CLASSES
//

const PlugStackState = {

	ALLDISPLAYED: 0,
	MISSING: 1,
	MUTABLE: 2

}

const MutabilityType = {

	ALL: 0,
	OUTPUTSONLY: 1,
	NONE: 2

}

const HighlightState = {

	NORMAL: 0,
	PRESSED: 1,
	HOVER: 2

};

const ButtonSide = {

	LEFT: 0,
	RIGHT: 1

};

class BoundingBox {
	constructor(pos, width, height) {
		this.pos = pos;
		this.width = width;
		this.height = height;
	}
}

class InputOutputDisplayElement {

	static rowHeight = 1;
	static rowMargin = 1;
	static rowWidth = 1;

	rowHeight = InputOutputDisplayElement.rowHeight;
	rowMargin = InputOutputDisplayElement.rowMargin;
	rowWidth = InputOutputDisplayElement.rowWidth;

	constructor(bounds, mutable = MutabilityType.NONE, topOffset = 0, colors = COLOR_PALETTE_GRAY, maxplugs = 100000) {
		this.normalbounds = bounds;
		this.colors = colors;

		this.topOffset = topOffset;

		this.leftState = PlugStackState.ALLDISPLAYED;
		this.rightState = PlugStackState.ALLDISPLAYED;

		this.mutable = mutable;

		this.leftPlugs = [];
		this.rightPlugs = [];
		this.maxplugs = maxplugs;

		this.maxnheight = 0;

	}

	addVisualPlug(side, plug, index = -1) {

		let arr = side == ButtonSide.LEFT ? this.leftPlugs : this.rightPlugs;
		if (index != -1) arr.splice(index, 0, plug);
		else arr.push(plug);

	}

	removeVisualPlug(plug) {

		this.leftPlugs.remove(plug);
		this.rightPlugs.remove(plug);

	}

	getState(side) {

		if (this.mutable == MutabilityType.ALL) {

			return PlugStackState.MUTABLE;

		} else if (this.mutable == MutabilityType.OUTPUTSONLY && side == ButtonSide.RIGHT) {

			return PlugStackState.MUTABLE;

		} else {

			if (side == ButtonSide.LEFT) {

				return this.leftState;

			} else {

				return this.rightState;

			}

		}

	}

	trySetState(side, state) {

		if (side == ButtonSide.LEFT) {

			this.leftState = state;

		} else {

			this.rightState = state;

		}

	}

	getBounds() {
		return new BoundingBox(new Point(this.normalbounds.pos.x, this.normalbounds.pos.y), this.normalbounds.width, this.normalbounds.height + this.maxnheight * (this.rowHeight + this.rowMargin));
	}

	render() {
		const thiso = this;

		let decisionpointer = null;
		let decisiontitle = null;

		let pi = new Point((thiso.getBounds().pos.x + thiso.getBounds().width) - 12, thiso.getBounds().pos.y + 12);
		let p = cartToReal(pi);

		if (hoverElement == thiso) {

			if ((((mouseX - p.x) ** 2 + (mouseY - p.y) ** 2) < (16 / canvasStepRatioY()) ** 2) && (!mouseIsPressed || mouseClickedThisFrame)) {

				decisionpointer = "pointer";
				if (mouseClickedThisFrame) {

					uielements.remove(thiso);
					thiso.onRemoved();

				}

			}

		}

		let sideContexts = [];
		sideContexts.push({
			side: ButtonSide.LEFT,
			plugs: this.leftPlugs,
			xoffset: 0
		});
		sideContexts.push({
			side: ButtonSide.RIGHT,
			plugs: this.rightPlugs,
			xoffset: this.getBounds().width - this.rowWidth
		});

		function getRenderSide(side, plugs) {

			let toRenderSide = [...plugs];
			let dc = false;

			let lstate = thiso.getState(side);
			if (lstate == PlugStackState.ALLDISPLAYED || lstate == PlugStackState.MISSING) {

				//render immutable plugs
				dc = true;

				if (lstate == PlugStackState.MISSING) {

					//render add button
					toRenderSide.push(new ClickHandler(function() {
						thiso.addButtonPushed(side);
					}));

				}

			} else if (lstate == PlugStackState.MUTABLE) {

				//render mutable plugs	
				//render plug adder
				if (toRenderSide.length < thiso.maxplugs) toRenderSide.push(new ClickHandler(function() {

					let c = thiso.getNewPlug(side, true);
					c.attach(side == ButtonSide.LEFT ? ButtonSide.RIGHT : ButtonSide.LEFT, thiso);
					drag = {
						drag: function() {
							c.isDragging(side);
						},
						drop: function() {
							c.onDragDrop(side);
						}
					};

				}, SideTabType.DRAG_AND_DROP_PLUG));

			}

			return {

				data: toRenderSide,
				dc: dc

			};

		}

		this.maxnheight = max(getRenderSide(sideContexts[0].side, sideContexts[0].plugs).data.length, getRenderSide(sideContexts[1].side, sideContexts[1].plugs).data.length);

		if (selectedItem == this) {
			fill(0);
			stroke(0);
			strokeWeight(max(9, 9 / canvasStepRatioY()));
			let doP = cartToReal(this.getBounds().pos);
			rect(
				doP.x,
				doP.y,
				this.getBounds().width / canvasStepRatioX(),
				this.getBounds().height / canvasStepRatioY(),
				10 / canvasStepRatioY()
			);

		}

		fill(this.colors.normalcolor);
		stroke(this.colors.darkcolor);
		strokeWeight(3 / canvasStepRatioY());
		let doP = cartToReal(this.getBounds().pos);
		rect(
			doP.x,
			doP.y,
			this.getBounds().width / canvasStepRatioX(),
			this.getBounds().height / canvasStepRatioY(),
			10 / canvasStepRatioY()
		);

		let buttoning = false;

		for (let i = 0; i < 2; i++) {

			let context = sideContexts[i];
			let rs = getRenderSide(context.side, context.plugs);

			for (let j = 0; j < rs.data.length; j++) {

				let cdata = rs.data[j];

				let jbounds = new BoundingBox(new Point(context.xoffset, this.topOffset + j * (this.rowHeight + this.rowMargin)), this.rowWidth, this.rowHeight);
				let jboundsabs = new BoundingBox(new Point(jbounds.pos.x + this.getBounds().pos.x, jbounds.pos.y + this.getBounds().pos.y), jbounds.width, jbounds.height);
				let kbl = pointInBox(realToCart(new Point(mouseX, mouseY)), jboundsabs) && hoverElement == this;
				if (kbl && !mouseIsPressed) {

					decisiontitle = this.produceAltText(context.side, cdata.type);
					decisionpointer = "pointer";

				}
				let hstate;

				if (cdata.type == SideTabType.DRAG_AND_DROP_PLUG) {
					if (!rs.dc) {
						if (kbl) {
							if (mouseClickedThisFrame) {
								buttoning = true;
								let oside = context.side == ButtonSide.LEFT ? ButtonSide.RIGHT : ButtonSide.LEFT;
								drag = {
									drag: function() {
										cdata.isDragging(oside);
									},
									drop: function() {
										cdata.onDragDrop(oside);
									}
								};
							}
							if (mouseIsPressed) {
								hstate = HighlightState.NORMAL;
							} else {
								hstate = HighlightState.HOVER;
							}
						} else {
							hstate = HighlightState.NORMAL;
						}
					} else {
						hstate = HighlightState.PRESSED;
					}
				} else if (cdata.type == SideTabType.CLICK_BUTTON) {
					if (kbl) {
						if (mouseClickedThisFrame) {
							buttoning = true;
							cdata.action();
						}
						if (mouseIsPressed) {
							hstate = HighlightState.PRESSED;
						} else {
							hstate = HighlightState.HOVER;
						}
					} else {
						hstate = HighlightState.NORMAL;
					}
				}

				strokeWeight(3 / canvasStepRatioY());
				stroke(this.colors.darkcolor);
				fill(this.colors.normalcolor);
				if (hstate == HighlightState.PRESSED && !drag) {
					fill(this.colors.darkcolor);
				} else if (hstate == HighlightState.NORMAL) {
					fill(this.colors.normalcolor);
				} else if (hstate == HighlightState.HOVER) {
					fill(this.colors.lightcolor);
				}

				let v1 = cartToReal(jboundsabs.pos);

				if (cdata.type == SideTabType.CLICK_BUTTON && cdata.display == SideTabType.CLICK_BUTTON) {

					let w1 = jbounds.width / canvasStepRatioX();
					let h1 = jbounds.height / canvasStepRatioX();
					rect(v1.x, v1.y, w1, h1);
					noStroke();
					fill(this.colors.darkcolor);
					circle(v1.x + (w1 / 2), v1.y + h1 / 2, (this.rowWidth / 8) / canvasStepRatioY());

					circle(v1.x + (w1 * 1.5 / 5), v1.y + h1 / 2, (this.rowWidth / 8) / canvasStepRatioY());
					circle(v1.x + (w1 * 3.5 / 5), v1.y + h1 / 2, (this.rowWidth / 8) / canvasStepRatioY());

				} else if (cdata.type == SideTabType.DRAG_AND_DROP_PLUG) {

					let o = context.side == ButtonSide.LEFT ? cdata.left : cdata.right;
					if (o != null) {

						stroke(o.colors.darkcolor);
						fill((cdata.dragging == (context.side == ButtonSide.LEFT ? ButtonSide.RIGHT : ButtonSide.LEFT)) ?
							o.colors.darkcolor : o.colors.normalcolor);

					}
					drawPlug(v1.x, v1.y, jbounds.width / canvasStepRatioX(), jbounds.height / canvasStepRatioY(), context.side);

				} else if (cdata.display == SideTabType.DRAG_AND_DROP_PLUG) { //buttons

					drawPlug(v1.x, v1.y, jbounds.width / canvasStepRatioX(), jbounds.height / canvasStepRatioY(), context.side, true);

				}

			}

		}

		this.betweenRender();

		if (hoverElement == thiso) {

			if (decisionpointer == null) decisionpointer = "grab";

			//draw X
			fill(thiso.colors.normalcolor);
			stroke(thiso.colors.darkcolor);
			strokeWeight(3 / canvasStepRatioY());
			circle(p.x, p.y, 30 / canvasStepRatioY());
			stroke(255, 0, 0);
			let l1 = cartToReal(new Point(pi.x + 5, pi.y + 5));
			let l2 = cartToReal(new Point(pi.x - 5, pi.y - 5));
			let l3 = cartToReal(new Point(pi.x + 5, pi.y - 5));
			let l4 = cartToReal(new Point(pi.x - 5, pi.y + 5));
			line(l1.x, l1.y, l2.x, l2.y);
			line(l3.x, l3.y, l4.x, l4.y);

			if (!buttoning && !drag && mouseIsPressed && !isPinching) {

				decisionpointer = "grabbing";
				let deltaX = mouseX - pmouseX;
				let deltaY = mouseY - pmouseY;
				thiso.normalbounds.pos.x += deltaX * canvasStepRatioX();
				thiso.normalbounds.pos.y += deltaY * canvasStepRatioY();

			}

		}

		if (!_cursorSetFrame) setCursor(decisionpointer);
		if (!_titleSetFrame) setTitle(decisiontitle);

	}

	test(cartPos) {
		return (pointInBox(cartPos, this.getBounds()));
	}

	onRemoved() {
		if (selectedItem == this) clearTable();
		selectedItem = null;
		let n2 = this.leftPlugs.length;
		for (let i = 0; i < n2; i++) {
			this.leftPlugs[0].sever();
		}
		let n = this.rightPlugs.length;
		for (let i = 0; i < n; i++) {
			this.rightPlugs[0].sever();
		}
	} //override this?
	betweenRender() {} //override this
	async onFocused() {
		while (true) {
			await new Promise(r => setTimeout(r, 100));
			if (!loadingSelection) break;
		};
		loadingSelection = true;
		await this.onFocusedChild();
		loadingSelection = false;
	}
	async onFocusedChild() {} //override this

	produceAltText(side, sideTabType) {
		throw new Error("This needs to be implemented by subclass!");
	}

	addButtonPushed(side) { //loadmoreinputs (side)
		throw new Error("This needs to be implemented by subclass!");
	}

	getNewPlug(side, editable) { //override this
		return new Plug(editable);
	}

}

const SideTabType = {

	DRAG_AND_DROP_PLUG: 0,
	CLICK_BUTTON: 1

}

class ClickHandler {

	type = SideTabType.CLICK_BUTTON;

	constructor(action, display = this.type) {

		this.action = action;
		this.display = display;

	}

}

//plugs


class Plug {

	type = SideTabType.DRAG_AND_DROP_PLUG;

	constructor(editable = false) {

		this.left = null;
		this.right = null;

		this.previousDragTarget = null;
		this.previousDragIndex = 0;

		this.editable = editable;

		this.dragging = null;

	}

	sever() {

		this.cut(ButtonSide.LEFT, true);
		this.cut(ButtonSide.RIGHT, true);

	}

	cut(side, force = true) {

		let t = side == ButtonSide.LEFT ? this.left : this.right;
		if (t == null) return;
		this.disconnectLogically();

		if (force) t.trySetState(side == ButtonSide.LEFT ? ButtonSide.RIGHT : ButtonSide.LEFT, PlugStackState.MISSING);
		t.removeVisualPlug(this);

		if (side == ButtonSide.LEFT) this.left = null;
		else this.right = null;

		if (selectedItem) selectedItem.onFocused();

	}

	fullyConnected() {

		if (this.left == null || this.right == null) return false;
		return true;

	}

	disconnectLogically() {

		if (!this.fullyConnected()) return;
		this.childDisconnectLogically();

	}

	connectLogically(index, side) {

		if (!this.fullyConnected()) return true;
		return this.childConnectLogically(index, side);

	}

	attach(side, element, index = -1) {

		if (!this.testCompatibility(side, element)) return;
		this.cut(side, false);

		//test for cycles
		let other = (side == ButtonSide.LEFT) ? this.right : this.left;

		if (other != null) {

			let tracked = [element, other];
			let queue = [element, other];

			while (queue.length != 0) {
				let c = queue.pop();
				for (let i = 0; i < c.rightPlugs.length; i++) {
					let ct = c.rightPlugs[i].right;
					if (ct != null) {
						if (tracked.includes(ct)) {
							return;
						} else {
							tracked.push(ct);
							queue.push(ct);
						}
					}
				}
			}

		}

		if (element.maxplugs <= (side == ButtonSide.LEFT ? element.rightPlugs : element.leftPlugs).length) return;
		if (side == ButtonSide.LEFT) this.left = element;
		else this.right = element;
		if (this.connectLogically(index, side)) {
			element.addVisualPlug(side == ButtonSide.LEFT ? ButtonSide.RIGHT : ButtonSide.LEFT, this, index);
		} else {
			if (side == ButtonSide.LEFT) this.left = null;
			else this.right = null;
		}

		if (selectedItem) selectedItem.onFocused();

	}

	isDragging(side) {

		this.dragging = side;

		//let dragger = side == ButtonSide.LEFT ? this.left : this.right;
		let stationary = side == ButtonSide.LEFT ? this.right : this.left;
		if (stationary == null) throw new Error("Null stationary node when dragging.");

		let o2 = stationary;
		let v = o2.colors;
		let rw = this.getSize(side).width / canvasStepRatioX();
		let ry = this.getSize(side).height / canvasStepRatioY();

		let cono = (side == ButtonSide.LEFT ? o2.leftPlugs : o2.rightPlugs);
		let inde = cono.indexOf(this);
		let ind = inde == -1 ? 0 : inde;
		let vPos2 = new BoundingBox(
			new Point(
				o2.getBounds().pos.x + (side == ButtonSide.LEFT ? 0 : (o2.getBounds().width - o2.rowWidth)),
				o2.getBounds().pos.y + o2.topOffset + o2.rowHeight * ind + (o2.rowMargin * ind)
			),
			o2.rowWidth,
			o2.rowHeight
		);
		let doP2 = cartToReal(vPos2.pos);

		let thatCenX = doP2.x + (vPos2.width / canvasStepRatioX()) / 2;
		thatCenX += (side ? 1 : -1) * (vPos2.width / canvasStepRatioX()) / 2;
		let thatCenY = doP2.y + (vPos2.height / canvasStepRatioY()) / 2;

		drawBezier(mouseX + (side ? -rw / 2 : rw / 2), mouseY, thatCenX, thatCenY, 70);
		strokeWeight(3 / canvasStepRatioY());
		v.darkcolor.setAlpha(70);
		v.normalcolor.setAlpha(70);
		stroke(v.darkcolor);
		fill(v.normalcolor);
		v.darkcolor.setAlpha(255);
		v.normalcolor.setAlpha(255);
		drawPlug(mouseX - rw / 2, mouseY - ry / 2, rw, ry, side == ButtonSide.LEFT ? ButtonSide.RIGHT : ButtonSide.LEFT);

		let handled = null;
		let index = 0;
		let mCart = realToCart(new Point(mouseX, mouseY));
		for (let i = uielements.length - 1; i >= 0; i--) {
			let celement = uielements[i];
			if (celement.test(mCart)) {

				let ys = (mCart.y - celement.getBounds().pos.y - celement.topOffset) + (celement.rowMargin / 2);
				index = floor(ys / (celement.rowHeight + celement.rowMargin));
				index = max(0, min((side == ButtonSide.LEFT ? celement.rightPlugs : celement.leftPlugs).length, index));

				if (celement != this.previousDragTarget || index != this.previousDragIndex) {
					if (side == ButtonSide.RIGHT && celement.mutable == MutabilityType.OUTPUTSONLY || celement.mutable == MutabilityType.NONE) break;
					this.attach(side, celement, index);
				}
				handled = celement == stationary ? null : celement;
				break;
			}
		}

		if (handled == null && this.previousDragTarget != null) {
			this.cut(side, false);
		}

		this.previousDragTarget = handled;
		this.previousDragIndex = index;
	}

	onDragDrop(side) {

		this.dragging = null;
		if (!this.fullyConnected()) this.sever();

	}

	childDisconnectLogically() {
		throw new Error("This needs to be implemented by subclass!");
	}

	childConnectLogically(index, side) {
		throw new Error("This needs to be implemented by subclass!");
	}

	testCompatibility(side, element) { //override this
		if (side == ButtonSide.LEFT && this.right == element) return false;
		if (side == ButtonSide.RIGHT && this.left == element) return false;
		return true;
	}

	getSize(side) { //override this
		return {
			width: 0,
			height: 0
		};
	}

}

class TransactionOutPlug extends Plug {

	constructor(editable = false) {
		super(editable);
	}

	childDisconnectLogically() {
		if (this.editable) {
			this.left.transaction.outputs.remove(this.right.utxo);
			this.right.utxo.tx = null;
		} else {
			this.left.loadedoutputs.remove(this.right.utxo);
		}

	}

	childConnectLogically(index, side) {

		if (this.editable) {
			let arr = this.left.transaction.outputs;
			if (side == ButtonSide.LEFT) arr.splice(index, 0, this.right.utxo); else arr.splice(this.left.rightPlugs.indexOf(this), 0, this.right.utxo);
			this.right.utxo.tx = this.left.transaction;
		}

		return true;

	}

	testCompatibility(side, element) {
		if (!super.testCompatibility(side, element)) return false;
		if (side == ButtonSide.LEFT && element.constructor.name != "TransactionDisplay") return false;
		if (side == ButtonSide.RIGHT && element.constructor.name != "UTXODisplay") return false;
		return true;
	}

	getSize(side) {

		return {

			width: side == ButtonSide.LEFT ? TransactionDisplay.rowWidth : UTXODisplay.rowWidth,
			height: side == ButtonSide.LEFT ? TransactionDisplay.rowHeight : UTXODisplay.rowHeight

		};

	}

}

class TransactionInPlug extends Plug {

	constructor(editable = false) {
		super(editable);
	}

	childDisconnectLogically() {
		if (this.editable) {
			this.right.transaction.inputs.remove(this.left.utxo);
			this.left.utxo.spendertx = null;
		} else {
			this.right.loadedinputs.remove(this.left.utxo);
		}

	}

	childConnectLogically(index, side) {

		if (this.editable) {
			if (!this.left.utxo.getTXID()) {
				return false;
			}
			let arr = this.right.transaction.inputs;
			if (side == ButtonSide.RIGHT) arr.splice(index, 0, this.left.utxo); else arr.splice(this.right.leftPlugs.indexOf(this), 0, this.left.utxo);
			this.left.utxo.spendertx = this.right.transaction;
		}

		return true;

	}

	testCompatibility(side, element) {
		if (!super.testCompatibility(side, element)) return false;
		if (side == ButtonSide.LEFT && element.constructor.name != "UTXODisplay") return false;
		if (side == ButtonSide.RIGHT && element.constructor.name != "TransactionDisplay") return false;
		return true;
	}

	getSize(side) {

		return {

			width: side == ButtonSide.LEFT ? UTXODisplay.rowWidth : TransactionDisplay.rowWidth,
			height: side == ButtonSide.LEFT ? UTXODisplay.rowHeight : TransactionDisplay.rowHeight

		};

	}

}

//
// UI + BITCOIN CONTAINERS
//

class UTXODisplay extends InputOutputDisplayElement {

	static rowHeight = 30;
	static rowMargin = 5;
	static rowWidth = 40;

	rowHeight = UTXODisplay.rowHeight;
	rowMargin = UTXODisplay.rowMargin;
	rowWidth = UTXODisplay.rowWidth;

	constructor(centerPos, utxo, mutable) {
		super(new BoundingBox(new Point(centerPos.x - 100, centerPos.y - 50), 200, 100), mutable, 65, utxo.status.colors, 1);
		this.utxo = utxo;

		this.trySetState(ButtonSide.LEFT, utxo.iscoinbase ? PlugStackState.ALLDISPLAYED : PlugStackState.MISSING);
		this.trySetState(ButtonSide.RIGHT, PlugStackState.MISSING);

	}

	betweenRender() {

		let bounds = this.getBounds();
		let pos = cartToReal(bounds.pos);

		let xFractional = bounds.width / canvasStepRatioX();
		let centerX = pos.x + xFractional * 0.5;
		let yFractional = bounds.height / canvasStepRatioY();

		fill(100);
		noStroke();
		textAlign(CENTER, CENTER);

		textSize(20 / canvasStepRatioY());
		let txid = this.utxo.getTXID();
		let texta = txid == null ? "?TX (OUTPUT ONLY)" : txid.substring(0, 7) + "..." + txid.substring(txid.length - 7) + ":" + this.utxo.getOutpoint();
		text(texta, centerX, pos.y + (20 / canvasStepRatioY()));

		textSize(14.5 / canvasStepRatioY());

		let ad = this.utxo.getAddress();
		let textb = getAddressType(ad) + ": " + (ad.length <= 14 ? ad : ad.substring(0, 7) + "..." + ad.substring(ad.length - 7));
		text(textb, centerX, pos.y + (35 / canvasStepRatioY()));

		textSize(13 / canvasStepRatioY());

		if (this.utxo.status == Status.STATUS_CONFIRMED) {

			text((this.utxo.iscoinbase ? "COINBASE" : "SPENT") + " #" + this.utxo.confblock, centerX, pos.y + (50 / canvasStepRatioY()));

		} else {
			
			text(this.utxo.status.desc, centerX, pos.y + (50 / canvasStepRatioY()));

		}

		textSize(20 / canvasStepRatioY());

		let bor = this.utxo.remaindervalue;
		text((bor ? "[" : "") + satsAsBitcoin(this.utxo.getValue()) + (bor ? "]" : ""), centerX, pos.y + yFractional - (16 / canvasStepRatioY()));

	}

	produceAltText(side, sideTabType) {

		if (sideTabType == SideTabType.DRAG_AND_DROP_PLUG) return null;

		if (side == ButtonSide.LEFT) {
			return "Load creator transaction";
		} else {
			return "Load consumer transaction";
		}

	}

	addButtonPushed(side) { //loadmoreinputs (side)
		this.trySetState(side, PlugStackState.ALLDISPLAYED);

		let txid = this.utxo.txid;

		let centerP = this.getBounds().pos.y + this.getBounds().height / 2;

		let c = this.getNewPlug(side, false);

		let promise = side == ButtonSide.LEFT ? getTransactionFull(txid) : this.utxo.getSpenderTransaction();

		promise.then((tx) => {

			let txd = new TransactionDisplay(
				new Point(
					(this.getBounds().pos.x + ((side == ButtonSide.RIGHT) ? this.getBounds().width + 250 : -250)),
					centerP
				),
				tx,
				MutabilityType.NONE
			);

			if (side == ButtonSide.LEFT) {

				c.attach(ButtonSide.RIGHT, this);

				txd.loadedoutputs.push(this.utxo);

				c.attach(ButtonSide.LEFT, txd);

				if (tx.outputs.length == 1) txd.trySetState(ButtonSide.RIGHT, PlugStackState.ALLDISPLAYED);

			} else {

				c.attach(ButtonSide.LEFT, this);

				txd.loadedinputs.push(this.utxo);

				c.attach(ButtonSide.RIGHT, txd);

				if (tx.inputs.length == 1) txd.trySetState(ButtonSide.LEFT, PlugStackState.ALLDISPLAYED);

			}

			uielements.push(txd);

		});

	}

	async onFocusedChild() {

		let utx = this.utxo;
		await utx.loadAllData();
		clearTable();

		function getID() {
			return utx.getTXID() + ":" + utx.getOutpoint();
		}
		let idr = insertTableRow("ID", getID()); //TODO show some other id here when we have no parent
		insertTableRow("Status", utx.status == Status.STATUS_CONFIRMED ? "SPENT #" + utx.confblock : utx.status.desc);

		function getValue() {
			return satsAsBitcoin(utx.getValue());
		}
		let valr;

		let addI;
		let pk;

		function getSequenceDesc() {

			let nseq = utx.fullData.sequence;
			let info = utx.fullData.isFlaggingDisableLocktimeSelf() ? " (Flagging disable nLocktime) " : "";

			if ((nseq & ((1 << 31) >>> 0)) != 0) {

				info += "(No relative locktime) ";

			} else {

				let ltra = nseq & 0x0000ffff;

				if ((nseq & ((1 << 22) >>> 0)) != 0) { //time-based

					let a = round((ltra * 512) / 600);
					info += " (When confirmed, not spendable for ABOUT " +
						a + " block" + (a != 1 ? "s" : "") + " (BIP68)) ";

				} else { //block based

					let a = ltra;
					if (a != 0) info += " (When confirmed, not spendable for EXACTLY " +
						a + " block" + (a != 1 ? "s" : "") + " (BIP68)) ";

				}

			}
			return info + (utx.fullData.isRBFSelf() ? "(RBF)" : "");

		}

		let ls;
		let getLS;
		let rs;
		let getRS;
		let sp;

		function updateStatic() {
			idr.innerHTML = getID();
			valr.innerHTML = getValue();
			sp.innerHTML = utx.getSpenderTXID();
		}

		function resetRS() {

			if (rs && getRS) {
				rs.innerHTML = "";
				rs.appendChild(getRS());
			}

		}

		if (this.mutable == MutabilityType.NONE || this.mutable == MutabilityType.OUTPUTSONLY) {

			let ad = utx.getAddress();
			insertTableRow("Address", ad + " (" + getAddressType(ad) + ")");

		} else if (this.mutable == MutabilityType.ALL) {

			addI = HTMLInput("Address", utx.getAddress(), true, function(e) {
				try {
					addI.value = addI.value.trim();
					let t = addI.value.length == 0 ? "" : bitcoin.address.toOutputScript(addI.value, selchain.bnet).toString("hex");
					utx.scriptpubkey = t;
					addI.classList.remove("error");
					updateStatic();
					if (pk) pk.value = bitcoin.script.toASM(Buffer.from(utx.scriptpubkey, 'hex'));
					if (ls && getLS) {
						ls.innerHTML = "";
						ls.appendChild(getLS());
					}
					resetRS();
				} catch (ex) {
					addI.classList.add("error");
					print(ex);
				}
			}, "textarea");

			insertTableRowEV("Address", addI);

			let drpOptions = ["Value", "Remainder"];

			//Create and append select list
			let drp = document.createElement("select");
			drp.style.width = "90px";

			//Create and append the options
			for (let i = 0; i < drpOptions.length; i++) {
				let option = document.createElement("option");
				option.value = drpOptions[i];
				option.text = drpOptions[i];
				drp.appendChild(option);
			}
			
			drp.selectedIndex = utx.remaindervalue ? 1 : 0;
			
			let vr2;
			
			let ocdr = function(e) {

				let ind = drp.selectedIndex;

				vr2.innerHTML = "";

				if (ind == 0) { //Value
					vr2.appendChild(joinElements([drp, hi2]));
					utx.remaindervalue = undefined;
				} else if (ind == 1) { //Remainder
					vr2.appendChild(drp);
					utx.remaindervalue = true;
					utx.value = 0;
				}

			};

			drp.addEventListener("change", ocdr);

			let hi2 = numericDisplay(64, true, function() {
				return utx.getValue();
			}, true, "Value (Satoshi)", function(n) {
				try {
					utx.value = parseInt(n);
					hi2.classList.remove("error");
					updateStatic();
				} catch (e) {
					hi2.classList.add("error");
					print(e);
				}

			});
			vr2 = insertTableRowEV("Value (Satoshi) ", joinElements([drp, hi2]));
			ocdr();

		}

		valr = insertTableRow("Value", getValue());

		if (this.mutable == MutabilityType.NONE) {

			let ld = textAsElement(getSequenceDesc());
			let hi2 = numericDisplay(32, false, function() {
				return utx.fullData.sequence;
			});
			let vr2 = insertTableRowEV("nSequence", joinElements([hi2, ld]));

		} else if (this.mutable == MutabilityType.OUTPUTSONLY || this.mutable == MutabilityType.ALL) {

			let ld = textAsElement(getSequenceDesc());
			let hi2 = numericDisplay(32, false, function() {
				return utx.fullData.sequence;
			}, true, "nSequence", function(n) {
				utx.fullData.sequence = parseInt(n);
				ld.innerHTML = getSequenceDesc();
				updateStatic();
			});
			function upSeq(n){
				utx.fullData.sequence = n;
				hi2.getElementsByTagName("select")[0].selectedIndex = 0;
				hi2.getElementsByTagName("select")[0].dispatchEvent(new Event('change'));
				hi2.getElementsByTagName("input")[0].value = n;
				ld.innerHTML = getSequenceDesc();
				updateStatic();
			}
			let lbtntime = HTMLButton("Set relative MTP", function() {
				
				let ninputtime = parseInt(prompt("Enter amount of minutes:"));
				if (isNaN(ninputtime)) return;
				let ndatetimestamp = (ninputtime*60) / 512;
				upSeq(ndatetimestamp | ((1 << 22) >>> 0));

			});
			let lbtnblock = HTMLButton("Set block amount", function() {
				let blkn = prompt("Enter relative amount of blocks:");
				let nblocks = parseInt(blkn);
				if (isNaN(nblocks)) return;
				if (nblocks < 65535) upSeq(nblocks);
			});
			let lbtndisRelLt = HTMLButton("No lock + RBF", function() {
				upSeq(4294967293);
			});
			let lbtndisRBF = HTMLButton("No lock", function() {
				upSeq(4294967294);
			});
			let lbtnflagDisLt = HTMLButton("No lock + No locktime", function() {
				upSeq(4294967295);
			});
			let vr2 = insertTableRowEV("nSequence", joinElements([
				lbtntime, textAsElement(" "),
				lbtnblock, textAsElement(" "),
				lbtndisRelLt, textAsElement(" "),
				lbtndisRBF, textAsElement(" "),
				lbtnflagDisLt, textAsElement(" "),
				hi2, ld
			]));

		}

		let thiso = this;

		getRS = function() {

			let disSig = (thiso.mutable == MutabilityType.NONE);
			let tb;

			function doUpdating(field, mutatorConditionerSS, mutatorConditionerW) {

				try {
					utx.fullData.scriptsig = mutatorConditionerSS();
					utx.fullData.witness = mutatorConditionerW();
					field.classList.remove("error");
					updateStatic();
					if (addI) addI.value = utx.getAddress();
					tb.update();
				} catch (ex) {
					field.classList.add("error");
					print(ex);
				}

			}

			let tabs = [];
			tabs.push(new Tab(function() {
				return true;
			}, function() {

				let vet;
				vet = HTMLInput("ScriptSig (ASM)", bitcoin.script.toASM(Buffer.from(utx.fullData.scriptsig, 'hex')), !disSig, function(e) {
					doUpdating(vet, function() {
						return vet.value.length == 0 ? "" : bitcoin.script.fromASM(vet.value.trim()).toString("hex");
					}, function() {
						return utx.fullData.witness;
					});
				}, "textarea");

				let vet2;
				vet2 = HTMLInput("Witness (Seperate with empty lines)", utx.fullData.witness.map(x => x.length == 0 ? EMPTY_WITNESS_ITEM : x).join("\n\n"), !disSig, function(e) {
					doUpdating(vet2, function() {
						return utx.fullData.scriptsig;
					}, function() {
						let v = vet2.value.split("\n\n").map(x => x.replace("\n", "").trim());
						let vset = [];
						let rset = false;
						//ensure buffer is valid
						for (let i = 0; i < v.length; i++) {
							if (v[i].length == 0) {
								if (i == v.length - 1) break;
								v[i] = EMPTY_WITNESS_ITEM;
								rset = true;
							}
							let vru = v[i] == EMPTY_WITNESS_ITEM ? "" : v[i];
							if (!new RegExp("^[a-fA-F0-9]*$").test(vru) || vru.length % 2 != 0) throw new Error("Not hex");
							vset.push(vru);
						}
						if (rset) {
							vet2.value = v.join("\n\n");
						}
						return vset;
					});
				}, "textarea");

				return joinElements([
					textAsElement("ScriptSig (ASM): "),
					document.createElement("br"),
					document.createElement("br"),
					vet,
					document.createElement("br"),
					document.createElement("br"),
					textAsElement("Witness: "),
					document.createElement("br"),
					document.createElement("br"),
					vet2
				]);

			}, "Raw", function() {}));

			let atype = getAddressType(utx.getAddress());

			if (atype == "p2pkh") {

				tabs.push(new Tab(function() {

					let nwit = utx.fullData.witness ? utx.fullData.witness.length == 0 : true;
					let tpushes = bitcoin.script.toASM(Buffer.from(utx.fullData.scriptsig, 'hex')).split(" ").length;

					return nwit && tpushes == 2;

				}, function() {

					let pkin = HTMLInput("Public key", bitcoin.script.toASM(Buffer.from(utx.fullData.scriptsig, 'hex')).split(" ")[1], !disSig, function(e) {
						doUpdating(pkin, function() {
							return bitcoin.script.fromASM(bitcoin.script.toASM(Buffer.from(utx.fullData.scriptsig, 'hex')).split(" ")[0] + " " + pkin.value.trim());
						}, function() {
							return utx.fullData.witness;
						});
					}, "textarea");
					let sigin = HTMLInput("Signature", bitcoin.script.toASM(Buffer.from(utx.fullData.scriptsig, 'hex')).split(" ")[0], !disSig, function(e) {
						doUpdating(sigin, function() {
							return bitcoin.script.fromASM(sigin.value.trim() + " " + bitcoin.script.toASM(Buffer.from(utx.fullData.scriptsig, 'hex')).split(" ")[1]);
						}, function() {
							return utx.fullData.witness;
						});
					}, "textarea");

					return joinElements([
						textAsElement("Public key: "),
						document.createElement("br"),
						document.createElement("br"),
						pkin,
						document.createElement("br"),
						document.createElement("br"),
						textAsElement("Signature: "),
						document.createElement("br"),
						document.createElement("br"),
						sigin,
					]);

				}, "p2pkh Spend", function() {

					utx.fullData.witness = [];
					utx.fullData.scriptsig = "01000100";
					updateStatic();
					tb.update();

				}));

			} else if (atype == "p2wpkh") {

				tabs.push(new Tab(function() {

					let nsig = utx.fullData.scriptsig ? utx.fullData.scriptsig.length == 0 : true;
					return nsig && utx.fullData.witness.length >= 1;

				}, function() {

					let pkin = HTMLInput("Public key", utx.fullData.witness[1], !disSig, function(e) {
						doUpdating(pkin, function() {
							return utx.fullData.scriptsig;
						}, function() {
							let newW = [...utx.fullData.witness];
							newW[1] = pkin.value.trim();
							return newW;
						});
					}, "textarea");
					let sigin = HTMLInput("Signature", utx.fullData.witness[0], !disSig, function(e) {
						doUpdating(sigin, function() {
							return utx.fullData.scriptsig;
						}, function() {
							let newW = [...utx.fullData.witness];
							newW[0] = sigin.value.trim();
							return newW;
						});
					}, "textarea");

					return joinElements([
						textAsElement("Public key: "),
						document.createElement("br"),
						document.createElement("br"),
						pkin,
						document.createElement("br"),
						document.createElement("br"),
						textAsElement("Signature: "),
						document.createElement("br"),
						document.createElement("br"),
						sigin,
					]);

				}, "p2wpkh Spend", function() {

					utx.fullData.witness = ["00", "00"];
					utx.fullData.scriptsig = "";
					updateStatic();
					tb.update();

				}));

			} else if (atype == "p2sh") {

				tabs.push(new Tab(function() {

					let nwit = utx.fullData.witness ? utx.fullData.witness.length == 0 : true;
					let tpushes = bitcoin.script.toASM(Buffer.from(utx.fullData.scriptsig, 'hex')).split(" ");

					return nwit && tpushes.length >= 1 && tpushes[0].length >= 2;

				}, function() {

					let shout;

					function getShout() {
						let se = bitcoin.script.toASM(Buffer.from(utx.fullData.scriptsig, 'hex')).split(" ");
						return bitcoin.crypto.hash160(Buffer.from(se[se.length - 1], 'hex')).toString("hex");
					}

					let i2 = bitcoin.script.toASM(Buffer.from(utx.fullData.scriptsig, 'hex'));
					let ini = i2.split(" ");
					let ssin = HTMLInput("ScriptSig", i2.slice(0, -ini[ini.length - 1].length), !disSig, function(e) {
						doUpdating(ssin, function() {

							let vak = bitcoin.script.toASM(Buffer.from(utx.fullData.scriptsig, 'hex'));
							let vaks = vak.split(" ");
							return bitcoin.script.fromASM(ssin.value.trim() + " " + vaks[vaks.length - 1]).toString("hex");

						}, function() {
							return utx.fullData.witness;
						});
					}, "textarea");
					let scrin = HTMLInput("Script", bitcoin.script.toASM(Buffer.from(ini[ini.length - 1], 'hex')), !disSig, function(e) {
						doUpdating(scrin, function() {

							let sr = bitcoin.script.fromASM(scrin.value.trim()).toString("hex");
							let vak = bitcoin.script.toASM(Buffer.from(utx.fullData.scriptsig, 'hex'));
							let vaks = vak.split(" ");
							vaks[vaks.length - 1] = sr;

							return bitcoin.script.fromASM(vaks.join(" ")).toString("hex");

						}, function() {
							return utx.fullData.witness;
						});
						shout.innerHTML = getShout();
					}, "textarea");

					shout = textAsElement(getShout());

					return joinElements([
						textAsElement("ScriptSig: "),
						document.createElement("br"),
						document.createElement("br"),
						ssin,
						document.createElement("br"),
						document.createElement("br"),
						textAsElement("Script: "),
						document.createElement("br"),
						document.createElement("br"),
						scrin,
						document.createElement("br"),
						document.createElement("br"),
						textAsElement("ScriptHash (Hash160): "),
						document.createElement("br"),
						document.createElement("br"),
						shout
					]);

				}, "p2sh Spend", function() {

					utx.fullData.witness = [];
					utx.fullData.scriptsig = "020100";
					updateStatic();
					tb.update();

				}));

			} else if (atype == "p2wsh") {

				tabs.push(new Tab(function() {

					let nsig = utx.fullData.scriptsig ? utx.fullData.scriptsig.length == 0 : true;
					return nsig && utx.fullData.witness.length >= 1;

				}, function() {

					let shout;

					function getShout() {
						return bitcoin.crypto.sha256(Buffer.from(utx.fullData.witness[utx.fullData.witness.length - 1], 'hex')).toString("hex");
					}

					let ini = utx.fullData.witness;
					if (ini == null) ini = [];
					let oini = ini.slice(0, -1);
					let witin = HTMLInput("Witness (Seperate with empty lines)", oini.map(x => x.length == 0 ? EMPTY_WITNESS_ITEM : x).join("\n\n"), !disSig, function(e) {
						doUpdating(witin, function() {
							return utx.fullData.scriptsig;
						}, function() {

							let v = witin.value.split("\n\n").map(x => x.replace("\n", "").trim());
							let vset = [];
							let rset = false;
							//ensure buffer is valid
							for (let i = 0; i < v.length; i++) {
								if (v[i].length == 0) {
									if (i == v.length - 1) break;
									v[i] = EMPTY_WITNESS_ITEM;
									rset = true;
								}
								let vru = v[i] == EMPTY_WITNESS_ITEM ? "" : v[i];
								if (!new RegExp("^[a-fA-F0-9]*$").test(vru) || vru.length % 2 != 0) throw new Error("Not hex");
								vset.push(vru);
							}
							if (rset) {
								witin.value = v.join("\n\n");
							}
							vset.push(utx.fullData.witness[utx.fullData.witness.length - 1]);
							return vset;

						});
					}, "textarea");
					let scrin = HTMLInput("Script", bitcoin.script.toASM(Buffer.from(ini[ini.length - 1], 'hex')), !disSig, function(e) {
						doUpdating(scrin, function() {
							return utx.fullData.scriptsig;
						}, function() {

							let sr = bitcoin.script.fromASM(scrin.value.trim()).toString("hex");
							let ret = utx.fullData.witness.slice(0, -1);
							ret.push(sr);

							return ret;

						});
						shout.innerHTML = getShout();
					}, "textarea");

					shout = textAsElement(getShout());

					return joinElements([
						textAsElement("Other witness items: "),
						document.createElement("br"),
						document.createElement("br"),
						witin,
						document.createElement("br"),
						document.createElement("br"),
						textAsElement("Script: "),
						document.createElement("br"),
						document.createElement("br"),
						scrin,
						document.createElement("br"),
						document.createElement("br"),
						textAsElement("ScriptHash (SHA256): "),
						document.createElement("br"),
						document.createElement("br"),
						shout
					]);

				}, "p2wsh Spend", function() {

					utx.fullData.witness = ["0100"];
					utx.fullData.scriptsig = "";
					updateStatic();
					tb.update();

				}));

			} else if (atype == "p2tr") {

				//TODO

			}

			let def = 0;

			for (let i = 0; i < tabs.length; i++) {
				if (tabs[i].getEnabled()) def = i;
			}

			tb = TabDisplay(tabs, def, disSig);
			tb.update();
			return tb.html

		}

		rs = insertTableRowEV("Redemption Data", getRS());

		getLS = function() {

			let tabDis = (thiso.mutable == MutabilityType.NONE || thiso.mutable == MutabilityType.OUTPUTSONLY);

			let tb;

			let tabs = [];

			function getSPK() {
				return bitcoin.script.toASM(Buffer.from(utx.scriptpubkey, 'hex'), 'hex');
			}

			function doUpdating(field, mutatorConditioner) {

				try {
					utx.scriptpubkey = mutatorConditioner();
					field.classList.remove("error");
					updateStatic();
					if (addI) addI.value = utx.getAddress();
					tb.update();
					resetRS();
				} catch (ex) {
					field.classList.add("error");
					print(ex);
				}

			}

			tabs.push(new Tab(function() {
				return true;
			}, function() {

				let pkin;
				pkin = HTMLInput("ScriptPubKey (ASM)", getSPK(), !tabDis, function(e) {
					doUpdating(pkin, function() {
						return pkin.value.length == 0 ? "" : bitcoin.script.fromASM(pkin.value.trim()).toString("hex");
					});
				}, "textarea");

				return joinElements([
					textAsElement("ScriptPubKey (ASM): "),
					document.createElement("br"),
					document.createElement("br"),
					pkin
				]);

			}, "Raw", function() {}));
			tabs.push(new Tab(function() {

				let spk = utx.scriptpubkey;
				//p2pkh detected
				return (utx.scriptpubkey.startsWith("76a914") && utx.scriptpubkey.endsWith("88ac") && utx.scriptpubkey.length == 50);

			}, function() {

				let pkin = HTMLInput("", utx.scriptpubkey.substring(6, 46), !tabDis, function(e) {
					doUpdating(pkin, function() {
						if (pkin.value.trim().length != 40) throw new Error();
						return "76a914" + pkin.value.trim() + "88ac";
					});
				}, "textarea");
				return joinElements([
					textAsElement("PubkeyHash (Hash160): "),
					document.createElement("br"),
					document.createElement("br"),
					pkin
				]);

			}, "p2pkh", function() {

				utx.scriptpubkey = "76a914000000000000000000000000000000000000000088ac";
				updateStatic();
				if (addI) addI.value = utx.getAddress();
				tb.update();
				resetRS();

			}));
			tabs.push(new Tab(function() {

				let spk = utx.scriptpubkey;
				//p2wpkh detected
				return (utx.scriptpubkey.startsWith("0014") && utx.scriptpubkey.length == 44);

			}, function() {

				let pkin = HTMLInput("", utx.scriptpubkey.substring(4), !tabDis, function(e) {
					doUpdating(pkin, function() {
						if (pkin.value.trim().length != 40) throw new Error();
						return "0014" + pkin.value.trim();
					});
				}, "textarea");
				return joinElements([
					textAsElement("PubkeyHash (Hash160): "),
					document.createElement("br"),
					document.createElement("br"),
					pkin
				]);

			}, "p2wpkh", function() {

				utx.scriptpubkey = "00140000000000000000000000000000000000000000";
				updateStatic();
				if (addI) addI.value = utx.getAddress();
				tb.update();
				resetRS();

			}));
			tabs.push(new Tab(function() {

				let spk = utx.scriptpubkey;
				//p2sh detected
				return (utx.scriptpubkey.startsWith("a914") && utx.scriptpubkey.endsWith("87") && utx.scriptpubkey.length == 46);

			}, function() {

				let pkin = HTMLInput("", utx.scriptpubkey.substring(4, 44), !tabDis, function(e) {
					doUpdating(pkin, function() {
						if (pkin.value.length != 40) throw new Error();
						return "a914" + pkin.value.trim() + "87";
					});
				}, "textarea");
				return joinElements([
					textAsElement("ScriptHash (Hash160): "),
					document.createElement("br"),
					document.createElement("br"),
					pkin
				]);

			}, "p2sh", function() {

				utx.scriptpubkey = "a914000000000000000000000000000000000000000087";
				updateStatic();
				if (addI) addI.value = utx.getAddress();
				tb.update();
				resetRS();

			}));
			tabs.push(new Tab(function() {

				let spk = utx.scriptpubkey;
				//p2wsh detected
				return (utx.scriptpubkey.startsWith("0020") && utx.scriptpubkey.length == 68);

			}, function() {

				let pkin = HTMLInput("", utx.scriptpubkey.substring(4), !tabDis, function(e) {
					doUpdating(pkin, function() {
						if (pkin.value.trim().length != 64) throw new Error();
						return "0020" + pkin.value.trim();
					});
				}, "textarea");
				return joinElements([
					textAsElement("ScriptHash (SHA256): "),
					document.createElement("br"),
					document.createElement("br"),
					pkin
				]);

			}, "p2wsh", function() {

				utx.scriptpubkey = "00200000000000000000000000000000000000000000000000000000000000000000";
				updateStatic();
				if (addI) addI.value = utx.getAddress();
				tb.update();
				resetRS();

			}));

			tabs.push(new Tab(function() {
				return false;
			}, function() {
				return joinElements([
					textAsElement("Coming soon!") //TODO
				]);
			}, "p2tr", function() {

				//TODO

			}));

			let def = 0;

			for (let i = 0; i < tabs.length; i++) {
				if (tabs[i].getEnabled()) def = i;
			}

			tb = TabDisplay(tabs, def, tabDis);
			tb.update();
			return tb.html;

		}

		ls = insertTableRowEV("Locking Script", getLS());

		sp = insertTableRow("Spender", utx.getSpenderTXID());

	}

	getNewPlug(side, editable) {
		return side == ButtonSide.LEFT ? new TransactionOutPlug(editable) : new TransactionInPlug(editable);
	}

}

class TransactionDisplay extends InputOutputDisplayElement {

	static rowHeight = 60;
	static rowMargin = 10;
	static rowWidth = 80;

	rowHeight = TransactionDisplay.rowHeight;
	rowMargin = TransactionDisplay.rowMargin;
	rowWidth = TransactionDisplay.rowWidth;

	constructor(centerPos, transaction, mutable) {
		super(new BoundingBox(new Point(centerPos.x - 200, centerPos.y - 65), 400, 160), mutable, 80, transaction.status.colors);
		this.transaction = transaction;

		this.trySetState(ButtonSide.LEFT, PlugStackState.MISSING);
		this.trySetState(ButtonSide.RIGHT, PlugStackState.MISSING);

		this.loadedinputs = [];
		this.loadedoutputs = [];

	}

	betweenRender() {

		let bounds = this.getBounds();
		let pos = cartToReal(bounds.pos);

		let xFractional = bounds.width / canvasStepRatioX();
		let centerX = pos.x + xFractional * 0.5;
		let yFractional = bounds.height / canvasStepRatioY();

		fill(100);
		noStroke();
		textAlign(CENTER, CENTER);

		textSize(45 / canvasStepRatioY());
		let btx = this.transaction.getBitcoin()
		let txid = btx.getId();
		text(txid.substring(0, 7) + "..." + txid.substring(txid.length - 7), centerX, pos.y + (35 / canvasStepRatioY()));

		textSize(20 / canvasStepRatioY());

		if (this.transaction.status == Status.STATUS_CONFIRMED) {
			
			let t = "CONFIRMED";
			if (this.transaction.inputs.length == 1 && this.transaction.inputs[0].iscoinbase) t = "COINBASE";
			text(t + " #" + this.transaction.confblock, centerX, pos.y + (70 / canvasStepRatioY()));

		} else {

			text(this.transaction.status.desctx, centerX, pos.y + (70 / canvasStepRatioY()));

		}
		
		textSize(30 / canvasStepRatioY());

		text(satsAsBitcoin(this.transaction.getInAmt()) + " in", centerX, pos.y + yFractional - (60 / canvasStepRatioY()));

		textSize(20 / canvasStepRatioY());

		let bor = !(this.transaction.customfee && this.transaction.customfee.rate);
		let nfee = ((this.transaction.getInAmt() - this.transaction.getOutAmt()) / (btx.weight() / 4)).toFixed(2);
		text((bor ? "[" : "") + nfee + "sat/vB" + (bor ? "]" : ""), centerX, pos.y + yFractional - (25 / canvasStepRatioY()));

		textAlign(LEFT, CENTER);
		text("VIN: " + this.transaction.inputs.length, pos.x + xFractional * 0.04, pos.y + yFractional - (25 / canvasStepRatioY()));

		textAlign(RIGHT, CENTER);
		text("VOUT: " + this.transaction.outputs.length, pos.x + xFractional * (1 - 0.04), pos.y + yFractional - (25 / canvasStepRatioY()));

	}

	produceAltText(side, sideTabType) {

		if (sideTabType == SideTabType.DRAG_AND_DROP_PLUG) return null;

		if (side == ButtonSide.LEFT) {
			return "Load all inputs...";
		} else {
			return "Load all outputs...";
		}

	}

	addButtonPushed(side, loading = false) { //loadmoreinputs (side)	
	
		let centerP = this.getBounds().pos.y + this.getBounds().height / 2;

		if (side == ButtonSide.LEFT) {

			for (let i = 0; i < this.transaction.inputs.length; i++) {

				let curi = this.transaction.inputs[i];
				if (!this.loadedinputs.some(e => (e.txid == curi.txid && e.outpoint == curi.outpoint))) {

					let c = this.getNewPlug(side, false);

					c.attach(ButtonSide.RIGHT, this);

					let utxd = new UTXODisplay(
						new Point(
							(this.getBounds().pos.x - this.transaction.inputs.length * 20) - 100,
							(centerP - (this.transaction.inputs.length / 2) * 150) + (i * 150) + 30
						),
						curi,
						loading ? MutabilityType.OUTPUTSONLY : MutabilityType.NONE
					);
					c.attach(ButtonSide.LEFT, utxd);
					utxd.trySetState(ButtonSide.RIGHT, PlugStackState.ALLDISPLAYED);
					if (loading) utxd.trySetState(ButtonSide.LEFT, PlugStackState.ALLDISPLAYED);
					
					c.editable = loading;
					
					uielements.push(utxd);

				}

			}

			this.loadedinputs = [...this.transaction.inputs];

			let thiso = this;
			//SORT LEFT PLUGS
			this.leftPlugs.sort(function(a, b) {

				return thiso.transaction.inputs.indexOf(a.left.utxo) < thiso.transaction.inputs.indexOf(b.left.utxo) ? -1 : 1;

			});

			this.trySetState(ButtonSide.LEFT, PlugStackState.ALLDISPLAYED);

		} else if (side == ButtonSide.RIGHT) {

			for (let i = 0; i < this.transaction.outputs.length; i++) {

				let curi = this.transaction.outputs[i];
				if (!this.loadedoutputs.some(e => (e.txid == curi.txid && e.outpoint == curi.outpoint))) {

					let c = this.getNewPlug(side, false);

					c.attach(ButtonSide.LEFT, this);

					let utxd = new UTXODisplay(
						new Point(
							(this.getBounds().pos.x + this.getBounds().width + this.transaction.outputs.length * 20) + 100,
							(centerP - (this.transaction.outputs.length / 2) * 150) + (i * 150) + 30
						),
						curi,
						loading ? MutabilityType.ALL : (this.transaction.outputs[i].status == Status.STATUS_COIN_SPENDABLE ? MutabilityType.OUTPUTSONLY : MutabilityType.NONE)
					);
					c.attach(ButtonSide.RIGHT, utxd);
					utxd.trySetState(ButtonSide.LEFT, PlugStackState.ALLDISPLAYED);
					
					c.editable = loading;
					
					uielements.push(utxd);

				}

			}

			this.loadedoutputs = [...this.transaction.outputs];

			let thiso = this;
			//SORT RIGHT PLUGS
			this.rightPlugs.sort(function(a, b) {

				return a.right.utxo.getOutpoint() < b.right.utxo.getOutpoint() ? -1 : 1;

			});

			this.trySetState(ButtonSide.RIGHT, PlugStackState.ALLDISPLAYED);

		}

	}

	async onFocusedChild() {

		let tx = this.transaction;
		clearTable();

		function getTXID() {
			return tx.getBitcoin().getId();
		}
		let tdr = insertTableRow("TXID", getTXID());
		let rbf = false;
		let nLd = true;
		for (let i = 0; i < tx.inputs.length; i++) {
			if (tx.inputs[i].fullData.isRBFSelf()) {
				rbf = true;
				break;
			}
		}
		for (let i = 0; i < tx.inputs.length; i++) {
			if (!tx.inputs[i].fullData.isFlaggingDisableLocktimeSelf()) {
				nLd = false;
				break;
			}
		}
		insertTableRow("Status", (tx.status == Status.STATUS_CONFIRMED ? "CONFIRMED #" + tx.confblock : tx.status.desctx) + (rbf ? " (RBF)" : ""));
		insertTableRow("Flow", tx.inputs.length + " in, " + tx.outputs.length + " out (" + satsAsBitcoin(tx.getInAmt()) + ", " + satsAsBitcoin(tx.getOutAmt()) + ")");

		let sdr;
		let edr;

		async function getExport() {
			let pbt;
			
			try {
				pbt = await tx.getPsbt();
			} catch (e) {
				pbt = e.message;
			}
			
			let rawd = HTMLInput("", tx.getBitcoin().toHex(), false, null, "textarea");
			
			let linkout = document.createElement("a");
			linkout.innerHTML = "Copy raw and go to broadcast page";
			linkout.href = "";
			linkout.target = "_blank";
			linkout.onclick = async (event) => {  
				
				event.preventDefault();
				
				//select the text field (mainly for mobile)
				rawd.select();
				rawd.setSelectionRange(0, 99999); // 

				await navigator.clipboard.writeText(rawd.value); 
				
				window.open("https://" + selchain.endpoint + "/tx/push", "_blank");
				
			};
			
			return joinElements([
				textAsElement("PSBT: "),
				document.createElement("br"),
				document.createElement("br"),
				HTMLInput("", pbt, false, null, "textarea"),
				document.createElement("br"),
				document.createElement("br"),
				textAsElement("Raw: "),
				document.createElement("br"),
				document.createElement("br"),
				rawd,
				document.createElement("br"),
				linkout
			]);
		}

		function getSizeDesc() {
			return nFormatter(tx.getBitcoin().byteLength(true), 2) + "B total, " + nFormatter(tx.getBitcoin().weight() / 4, 2) + "vB applied (" + nFormatter(tx.getBitcoin().weight(), 2) + "WU)";
		}

		async function updateStatic() {
			tdr.innerHTML = getTXID();
			if (sdr) sdr.innerHTML = getSizeDesc();
			if (edr) {
				edr.innerHTML = "";
				edr.appendChild(await getExport());
			}
		}

		function getVersionDesc() {
			return " (" + (tx.version <= 0 ? "Unknown" : (tx.version == 1 ? "Old" : (tx.version == 2 ? "BIP68, Conventional" : "BIP68, Unknown"))) + ")";
		}

		function getLocktimeDesc() {
			return " (Not mineable until after " + (tx.locktime < 500000000 ? "block " + tx.locktime : "BIP113 11-block MTP " + tx.locktime) + ")" + (nLd ? " (DISABLED BY INPUT SEQUENCES)" : "");
		}

		function getFeerateDesc() {
			return ((tx.getInAmt() - tx.getOutAmt()) / (tx.getBitcoin().weight() / 4)).toFixed(2) + "sat/vB";
		}

		function getFeevalueDesc() {
			return satsAsBitcoin((tx.getInAmt() - tx.getOutAmt()));
		}

		if (this.mutable == MutabilityType.NONE) {

			let vd = textAsElement(getVersionDesc());
			let hi = numericDisplay(32, true, function() {
				return tx.version;
			});
			let vr = insertTableRowEV("nVersion", joinElements([hi, vd]));
			let ld = textAsElement(getLocktimeDesc());
			let hi2 = numericDisplay(32, false, function() {
				return tx.locktime;
			});
			let vr2 = insertTableRowEV("nLocktime", joinElements([hi2, ld]));
			insertTableRow("Fee", getFeerateDesc() + " (" + getFeevalueDesc() + ")");

		} else if (this.mutable == MutabilityType.ALL) {
			let vd = textAsElement(getVersionDesc());
			let hi = numericDisplay(32, true, function() {
				return tx.version;
			}, true, "nVersion", function(n) {
				tx.version = parseInt(n);
				vd.innerHTML = getVersionDesc();
				updateStatic();
			});
			let vr = insertTableRowEV("nVersion", joinElements([hi, vd]));
			let ld = textAsElement(getLocktimeDesc());
			let hi2 = numericDisplay(32, false, function() {
				return tx.locktime;
			}, true, "nLocktime", function(n) {
				tx.locktime = parseInt(n);
				ld.innerHTML = getLocktimeDesc();
				updateStatic();
			});
			function upLt(n){
				tx.locktime = n;
				hi2.getElementsByTagName("select")[0].selectedIndex = 0;
				hi2.getElementsByTagName("select")[0].dispatchEvent(new Event('change'));
				hi2.getElementsByTagName("input")[0].value = n;
				ld.innerHTML = getLocktimeDesc();
				updateStatic();
			}
			let lbtntime = HTMLButton("Set MTP", function() { });
			let flatconfig = {enableTime: true};
			if (tx.locktime >= 500000000) flatconfig.defaultDate = new Date(tx.locktime*1000);
			flatpickr(lbtntime, flatconfig).config.onChange.push(function(selectedDates, dateStr, instance) { 
			
				let ndatetimestamp = selectedDates[0].getTime() / 1000;
				upLt(ndatetimestamp);
			
			});
			let lbtnblock = HTMLButton("Set block height", function() {
				let blkheight = prompt("Enter absolute locktime block height:");
				let nblocks = parseInt(blkheight);
				if (isNaN(nblocks)) return;
				if (nblocks < 500000000) upLt(nblocks);
			});
			let vr2 = insertTableRowEV("nLocktime", joinElements([lbtntime, textAsElement(" "), lbtnblock, textAsElement(" "), hi2, ld]));

			//Create array of options to be added
			let drpOptions = ["Remainder (Default)", "Rate", "Value"];

			//Create and append select list
			let drp = document.createElement("select");
			drp.style.width = "90px";

			//Create and append the options
			for (let i = 0; i < drpOptions.length; i++) {
				let option = document.createElement("option");
				option.value = drpOptions[i];
				option.text = drpOptions[i];
				drp.appendChild(option);
			}

			let r = insertTableRowEV("Fee", joinElements([drp, textAsElement(getFeerateDesc() + " (" + getFeevalueDesc() + ")")]));

			let va = null;
			let ind = 0;

			let fc = function(e) {

				ind = drp.selectedIndex;
				if (va) va.classList.remove("error");

				let des;

				if (ind == 0) { //Remainder (Default)
					va = null;
					tx.customfee = undefined;
					des = getFeerateDesc() + " (" + getFeevalueDesc() + ")";
				} else if (ind == 1) { //Rate
					let rt;
					if (tx.customfee && tx.customfee.rate) rt = tx.customfee.rate;
					else {
						rt = 1;
						tx.customfee = {
							rate: rt
						}
					}
					va = HTMLInput("Feerate (sat/vB)", rt, true, function(e) {

						let p = parseInt(va.value);
						tx.customfee = {
							rate: p ? p : 0
						}
						updateStatic();

					}, "number");
					des = " (" + getFeevalueDesc() + ")";
				} else if (ind == 2) { //Value
					let rt;
					if (tx.customfee && tx.customfee.value) rt = tx.customfee.value;
					else {
						rt = ceil(tx.getBitcoin().weight() / 4);
						tx.customfee = {
							value: rt
						}
					}
					va = HTMLInput("Value (sats)", rt, true, function(e) {

						let p = parseInt(va.value);
						tx.customfee = {
							value: p ? p : 0
						}
						updateStatic();

					}, "number");
					des = " (" + getFeerateDesc() + ")";
				}

				let desc = textAsElement(des);

				r.innerHTML = "";
				r.appendChild(va ? joinElements([drp, va, desc]) : joinElements([drp, desc]));
				updateStatic();

			};

			drp.addEventListener("change", fc);

			if (tx.customfee) {
				if (tx.customfee.rate) drp.selectedIndex = 1;
				else if (tx.customfee.value) drp.selectedIndex = 2;
				fc();
			}

		} else {}

		//virtualSize() is ceil(weight/4)
		sdr = insertTableRow("Size", getSizeDesc());
		edr = insertTableRowEV("Export", await getExport());

	}

	getNewPlug(side, editable) {
		return side == ButtonSide.RIGHT ? new TransactionOutPlug(editable) : new TransactionInPlug(editable);
	}

}

//
// HTML HELPERS
//

function textAsElement(text) {

	let p1 = document.createElement("span");
	p1.innerHTML = text;

	return p1;

}

function joinElements(elements) {

	let span = document.createElement("span");

	for (let i = 0; i < elements.length; i++) {

		span.appendChild(elements[i]);

	}

	return span;

}

function HTMLButton(label, behaviour) {

	let btn = document.createElement("button");
	btn.textContent = label;
	new p5.Element(btn).mouseClicked(behaviour);
	return btn;

}

function numericDisplay(bits, signed = false, getvalue, editable = false, label, onupdate) {

	let ind = 0;

	let mini;
	let maxi;

	let tSetter;
	let va;

	if (editable) {
		let hi = HTMLInput(label, getvalue(), true, function(e) {

			let v = hi.value;

			if (v.length == 0) {
				onupdate(0);
				hi.classList.remove("error");
				return;
			}

			let num;

			if (ind == 0) { //decimal
				num = v;
			} else if (ind == 1) { //hex (little endian)
				num = parseInt(v.split(/(?=(?:..)*$)/).reverse().join(""), 16);
				if (signed) num = ~~num;
			} else if (ind == 2) { //hex (big endian)
				num = parseInt(v, 16);
				if (signed) num = ~~num;
			} else if (ind == 3) { //binary (little endian)
				num = parseInt(v.split("").reverse().join(""), 2);
				if (signed) num = ~~num;
			} else if (ind == 4) { //binary (big endian)
				num = parseInt(v, 2);
				if (signed) num = ~~num;
			}

			if (isNaN(num) || num != floor(num)) {
				hi.classList.add("error");
				return;
			}

			if (num >= mini && num <= maxi) {
				onupdate(num);
				hi.classList.remove("error");
			} else {
				hi.classList.add("error");
			}

		}, "text", function() {
			if (hi.value.length == 0) hi.value = 0;
		});

		tSetter = function(t) {
			hi.value = t;
		};
		va = hi;
	} else {
		let sp = textAsElement(getvalue());
		tSetter = function(t) {
			sp.innerHTML = t;
		};
		va = sp;
	}

	let n1 = 2 ** bits;
	if (signed) {

		mini = (-n1 / 2);
		maxi = (n1 / 2) - 1;

	} else {

		mini = 0;
		maxi = n1 - 1;

	}

	//Create array of options to be added
	let drpOptions = ["Decimal", "Hex (Little-Endian)", "Hex (Big-Endian)", "Binary (Little-Endian)", "Binary (Big-Endian)"];

	//Create and append select list
	let drp = document.createElement("select");
	drp.style.width = "90px";

	//Create and append the options
	for (let i = 0; i < drpOptions.length; i++) {
		let option = document.createElement("option");
		option.value = drpOptions[i];
		option.text = drpOptions[i];
		drp.appendChild(option);
	}

	function pad(n, width, z) {
		z = z || '0';
		n = n + '';
		return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
	}

	drp.addEventListener("change", function(e) {

		ind = drp.selectedIndex;
		va.classList.remove("error");

		let v = getvalue();

		if (ind == 0) { //decimal
			tSetter(v);
		} else if (ind == 1) { //hex (little endian)
			tSetter(pad((parseInt(v)).toString(16), bits / 4).split(/(?=(?:..)*$)/).reverse().join(""));
		} else if (ind == 2) { //hex (big endian)
			tSetter(pad((parseInt(v)).toString(16), bits / 4));
		} else if (ind == 3) { //binary (little endian)
			tSetter(pad((parseInt(v)).toString(2), bits).split("").reverse().join(""));
		} else if (ind == 4) { //binary (big endian)
			tSetter(pad((parseInt(v)).toString(2), bits));
		}

	});

	return joinElements([drp, va]);

}

function HTMLInput(label, initial, enabled = false, changedBehaviour = null, type = "text", unfocus = null, enterBehaviour = null) {

	let inp;

	if (type == "textarea") {
		inp = document.createElement("textarea");
		inp.style.width = "100%";
	} else {
		inp = document.createElement("input");
		inp.type = type;
		inp.style.width = "280px";
	}

	inp.placeholder = label;
	inp.value = initial;
	inp.disabled = !enabled;

	if (type == "textarea") {
		setTimeout(function() {
			inp.style.height = inp.scrollHeight + "px";
		}, 1);
	}

	if (enabled) {

		inp.addEventListener('keyup', function(e) {

			if (e.key === 'Enter') {
				if (enterBehaviour) enterBehaviour(e);
			}
			changedBehaviour(e);

		});
		if (unfocus) inp.addEventListener('focusout', function(e) {
			unfocus();
		});

	}

	return inp;

}

class Tab {

	constructor(getEnabled, content, name, forcebehv) {
		this.getEnabled = getEnabled;
		this.content = content;
		this.name = name;
		this.forcebehv = forcebehv;
	}

}

function TabDisplay(tabs, defaultInd, disabled) {

	let outerDiv = document.createElement("div");

	let tabsArea = document.createElement("div");
	let contentArea = document.createElement("div");

	outerDiv.appendChild(tabsArea);
	outerDiv.appendChild(document.createElement("br"));
	outerDiv.appendChild(contentArea);

	let btns = [];

	let update;

	for (let i = 0; i < tabs.length; i++) {

		let cTab = tabs[i];

		let onClickT = function() {

			contentArea.innerHTML = "";
			if (cTab.getEnabled()) {

				contentArea.appendChild(cTab.content());

			} else {

				if (disabled) {

					contentArea.appendChild(textAsElement("Type not detected. (Incompatible)"));

				} else {

					contentArea.appendChild(joinElements([textAsElement("Type not compatible with current data. By forcing the data to this type, the current data will be erased. "), HTMLButton("Force", function() {

						cTab.forcebehv();
						update();
						contentArea.innerHTML = "";
						contentArea.appendChild(cTab.content());

					})]));

				}

			}

			for (let j = 0; j < btns.length; j++) {

				btns[j].disabled = j == i ? true : false;

			}

		}

		let cbtn = HTMLButton(cTab.name, onClickT);
		btns.push(cbtn);
		tabsArea.appendChild(cbtn);

		if (defaultInd == i) {
			onClickT();
		}

	}

	update = function() {

		for (let i = 0; i < tabs.length; i++) {

			btns[i].style.backgroundColor = tabs[i].getEnabled() ? "" : "red";

		}

	};

	return {

		html: outerDiv,
		tabs: tabsArea,
		content: contentArea,
		update: update

	};

}
