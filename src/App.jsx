import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import './App.css';

const DigitRecognizer = () => {
    const [model, setModel] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [drawing, setDrawing] = useState(false);
    const [clickX, setClickX] = useState([]);
    const [clickY, setClickY] = useState([]);
    const [clickDrag, setClickDrag] = useState([]);
    const [canvasWidth] = useState(350);
    const [canvasHeight] = useState(350);
    const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);
    const canvasRef = useRef(null);
    const offscreenCanvasRef = useRef(null);

    useEffect(() => {
        const loadModel = async () => {
            try {
                const loadedModel = await tf.loadLayersModel("./assets/model.json");
                setModel(loadedModel);
            } catch (error) {
                console.error('Error loading model:', error);
            }
        };
        loadModel();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const offscreenCanvas = document.createElement("canvas");
        offscreenCanvas.width = canvasWidth;
        offscreenCanvas.height = canvasHeight;
        offscreenCanvasRef.current = offscreenCanvas;
    }, [canvasWidth, canvasHeight]);

    const preprocessCanvas = (image) => {
        const tensor = tf.browser.fromPixels(image)
            .resizeNearestNeighbor([28, 28])
            .mean(2)
            .expandDims(2)
            .expandDims()
            .toFloat();
        return tensor.div(255.0);
    };

    const predictDigit = async () => {
        if (!model) {
            console.error('Model not loaded');
            return;
        }
        const tensor = preprocessCanvas(offscreenCanvasRef.current);
        const predictions = await model.predict(tensor).data();
        const results = Array.from(predictions);
        const maxIndex = results.indexOf(Math.max(...results));
        setPrediction(maxIndex);
    };

    const handleMouseDown = (e) => {
        const mouseX = Math.floor(e.clientX - e.target.getBoundingClientRect().left);
        const mouseY = Math.floor(e.clientY - e.target.getBoundingClientRect().top);
        setDrawing(true);
        setClickX([mouseX]);
        setClickY([mouseY]);
        setClickDrag([false]);
        setIsCanvasEmpty(false);
    };

    const handleMouseMove = (e) => {
        if (!drawing) return;
        const mouseX = Math.floor(e.clientX - e.target.getBoundingClientRect().left);
        const mouseY = Math.floor(e.clientY - e.target.getBoundingClientRect().top);
        setClickX(prevState => [...prevState, mouseX]);
        setClickY(prevState => [...prevState, mouseY]);
        setClickDrag(prevState => [...prevState, true]);
        redraw(mouseX, mouseY);
    };

    const handleMouseUp = () => {
        setDrawing(false);
    };

    const handleMouseLeave = () => {
        setDrawing(false);
    };

    const handleTouchStart = (e) => {
        const rect = e.target.getBoundingClientRect();
        const mouseX = Math.floor(e.touches[0].clientX - rect.left);
        const mouseY = Math.floor(e.touches[0].clientY - rect.top);
        setDrawing(true);
        setClickX([mouseX]);
        setClickY([mouseY]);
        setClickDrag([false]);
        setIsCanvasEmpty(false);
    };

    const handleTouchMove = (e) => {
        if (!drawing) return;
        const rect = e.target.getBoundingClientRect();
        const mouseX = Math.floor(e.touches[0].clientX - rect.left);
        const mouseY = Math.floor(e.touches[0].clientY - rect.top);
        setClickX(prevState => [...prevState, mouseX]);
        setClickY(prevState => [...prevState, mouseY]);
        setClickDrag(prevState => [...prevState, true]);
        redraw(mouseX, mouseY);
    };

    const handleTouchEnd = () => {
        setDrawing(false);
    };

    const handleTouchCancel = () => {
        setDrawing(false);
    };

    const clearCanvas = () => {
        const ctx = offscreenCanvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        setPrediction(null);
        setClickX([]);
        setClickY([]);
        setClickDrag([]);
        setIsCanvasEmpty(true);
    };

    const redraw = (x, y) => {
        const offscreenCanvas = offscreenCanvasRef.current;
        const ctx = offscreenCanvas.getContext('2d');
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.strokeStyle = "white";
        ctx.lineJoin = "round";
        ctx.lineWidth = 15;

        for (let i = 0; i < clickX.length; i++) {
            ctx.beginPath();
            if (clickDrag[i] && i) {
                ctx.moveTo(clickX[i - 1], clickY[i - 1]);
            } else {
                ctx.moveTo(clickX[i] - 1, clickY[i]);
            }
            ctx.lineTo(clickX[i], clickY[i]);
            ctx.closePath();
            ctx.stroke();
        }

        // Копируем содержимое offscreen canvas на основной canvas
        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        canvasCtx.drawImage(offscreenCanvas, 0, 0);
    };

    return (
        <div className="app-container">
            <h2 className="app-title">Распознавание рукописных цифр</h2>
            <div className="canvas-container">
                <canvas
                    ref={canvasRef}
                    id="canvas"
                    width={canvasWidth}
                    height={canvasHeight}
                    className="canvas"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchCancel}
                />
            </div>
            <div className="button-container">
                <button className={`btn btn-clear ${isCanvasEmpty ? 'disabled' : ''}`} onClick={clearCanvas}
                        disabled={isCanvasEmpty}>Очистить
                </button>
                <button className={`btn btn-predict ${isCanvasEmpty ? 'disabled' : ''}`} onClick={predictDigit}
                        disabled={isCanvasEmpty}>Распознать
                </button>
            </div>
            {prediction !== null && <p className="prediction">Предсказанная цифра: {prediction}</p>}
        </div>
    );
};

export default DigitRecognizer;
