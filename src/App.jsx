import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import './App.css';

const DigitRecognizer = () => {
    const [model, setModel] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const drawingRef = useRef(false);
    const clickXRef = useRef([]);
    const clickYRef = useRef([]);
    const clickDragRef = useRef([]);
    const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);

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
        const canvas = document.getElementById('canvas');
        const tensor = preprocessCanvas(canvas);
        const predictions = await model.predict(tensor).data();
        const results = Array.from(predictions);
        const maxIndex = results.indexOf(Math.max(...results));
        setPrediction(maxIndex);
    };

    const handleStart = (e) => {
        drawingRef.current = true;
        setIsCanvasEmpty(false);
        addClick(e);
    };

    const handleEnd = () => {
        drawingRef.current = false;
    };

    const addClick = (e) => {
        const mouseX = e.clientX - e.target.getBoundingClientRect().left;
        const mouseY = e.clientY - e.target.getBoundingClientRect().top;
        clickXRef.current.push(mouseX);
        clickYRef.current.push(mouseY);
        clickDragRef.current.push(true); // Изменим на true, чтобы фиксировать движение
    };

    const redraw = () => {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "white";
        ctx.lineJoin = "round";
        ctx.lineWidth = 5;
        requestAnimationFrame(draw);
    };

    const draw = () => {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "white";
        ctx.lineJoin = "round";
        ctx.lineWidth = 5;

        for (let i = 0; i < clickXRef.current.length; i++) {
            ctx.beginPath();
            if (clickDragRef.current[i] && i) {
                ctx.moveTo(clickXRef.current[i - 1], clickYRef.current[i - 1]);
            } else {
                ctx.moveTo(clickXRef.current[i] - 1, clickYRef.current[i]);
            }
            ctx.lineTo(clickXRef.current[i], clickYRef.current[i]);
            ctx.closePath();
            ctx.stroke();
        }
    };

    const handleMove = (e) => {
        if (!drawingRef.current) return;
        addClick(e);
        requestAnimationFrame(draw);
    };

    const clearCanvas = () => {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setPrediction(null);
        clickXRef.current = [];
        clickYRef.current = [];
        clickDragRef.current = [];
        setIsCanvasEmpty(true);
    };

    return (
        <div className="app-container">
            <h2 className="app-title">Распознавание рукописных цифр</h2>
            <div className="canvas-container">
                <canvas
                    id="canvas"
                    width={350}
                    height={350}
                    className="canvas"
                    onMouseDown={handleStart}
                    onMouseMove={handleMove}
                    onMouseUp={handleEnd}
                    onTouchStart={handleStart}
                    onTouchMove={handleMove}
                    onTouchEnd={handleEnd}
                    onTouchCancel={handleEnd}
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
