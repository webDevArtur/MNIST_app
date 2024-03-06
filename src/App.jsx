import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

    const preprocessCanvas = (image) => {
        const tensor = tf.browser.fromPixels(image)
            .resizeNearestNeighbor([28, 28])
            .mean(2)
            .expandDims(2)
            .expandDims()
            .toFloat();
        return tensor.div(255.0);
    };

    const redraw = useCallback(() => {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "white";
        ctx.lineJoin = "round";
        ctx.lineWidth = 10;

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
    }, [clickX, clickY, clickDrag]);

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

    const handleMouseDown = useCallback((e) => {
        const mouseX = e.clientX - e.target.getBoundingClientRect().left;
        const mouseY = e.clientY - e.target.getBoundingClientRect().top;
        setDrawing(true);
        setClickX(prevX => [...prevX, mouseX]);
        setClickY(prevY => [...prevY, mouseY]);
        setClickDrag(prevDrag => [...prevDrag, false]);
        setIsCanvasEmpty(false);
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (!drawing) return;
        const mouseX = e.clientX - e.target.getBoundingClientRect().left;
        const mouseY = e.clientY - e.target.getBoundingClientRect().top;
        setClickX(prevX => [...prevX, mouseX]);
        setClickY(prevY => [...prevY, mouseY]);
        setClickDrag(prevDrag => [...prevDrag, true]);
        redraw();
    }, [drawing, redraw]);

    const handleMouseUp = useCallback(() => {
        setDrawing(false);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setDrawing(false);
    }, []);

    const handleTouchStart = useCallback((e) => {
        const mouseX = e.touches[0].clientX - e.target.getBoundingClientRect().left;
        const mouseY = e.touches[0].clientY - e.target.getBoundingClientRect().top;
        setDrawing(true);
        setClickX(prevX => [...prevX, mouseX]);
        setClickY(prevY => [...prevY, mouseY]);
        setClickDrag(prevDrag => [...prevDrag, false]);
        setIsCanvasEmpty(false);
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (!drawing) return;
        const mouseX = e.touches[0].clientX - e.target.getBoundingClientRect().left;
        const mouseY = e.touches[0].clientY - e.target.getBoundingClientRect().top;
        setClickX(prevX => [...prevX, mouseX]);
        setClickY(prevY => [...prevY, mouseY]);
        setClickDrag(prevDrag => [...prevDrag, true]);
        redraw();
    }, [drawing, redraw]);

    const handleTouchEnd = useCallback(() => {
        setDrawing(false);
    }, []);

    const handleTouchCancel = useCallback(() => {
        setDrawing(false);
    }, []);

    const clearCanvas = useCallback(() => {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setPrediction(null);
        setClickX([]);
        setClickY([]);
        setClickDrag([]);
        setIsCanvasEmpty(true);
    }, []);

    const predictDigit = useCallback(async () => {
        if (!model) {
            console.error('Model not loaded');
            return;
        }
        const canvas = document.getElementById('canvas');
        const tensor = preprocessCanvas(canvas);
        const predictions = await model.predict(tensor).data();
        const results = Array.from(predictions);
        const maxIndex = results.indexOf(Math.max(...results));
        setPrediction(maxIndex);
    }, [model, preprocessCanvas]);

    return (
        <div className="app-container">
            <h2 className="app-title">Распознавание рукописных цифр</h2>
            <div className="canvas-container">
                <canvas
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
                    onTouchMoveCapture={handleTouchMove}
                />
            </div>
            <div className="button-container">
                <button className={`btn btn-clear ${isCanvasEmpty ? 'disabled' : ''}`} onClick={clearCanvas} disabled={isCanvasEmpty}>Очистить</button>
                <button className={`btn btn-predict ${isCanvasEmpty ? 'disabled' : ''}`} onClick={predictDigit} disabled={isCanvasEmpty}>Распознать</button>
            </div>
            {prediction !== null && <p className="prediction">Предсказанная цифра: {prediction}</p>}
        </div>
    );
};

export default DigitRecognizer;
