import React, { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import './App.css';

const DigitRecognizer = () => {
    const [model, setModel] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [drawing, setDrawing] = useState(false);
    const [points, setPoints] = useState([]);
    const canvasWidth = 350;
    const canvasHeight = 350;

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

    const handleMouseDown = (e) => {
        const rect = e.target.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        setDrawing(true);
        setPoints([{ x: mouseX, y: mouseY }]);
    };

    const handleMouseMove = (e) => {
        if (!drawing) return;
        const rect = e.target.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        setPoints([...points, { x: mouseX, y: mouseY }]);
        redraw();
    };

    const handleMouseUp = () => {
        setDrawing(false);
    };

    const handleMouseLeave = () => {
        setDrawing(false);
    };

    const clearCanvas = () => {
        setPrediction(null);
        setPoints([]);
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

    const redraw = () => {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "white";
        ctx.lineJoin = "round";
        ctx.lineWidth = 15;

        points.forEach((point, i) => {
            ctx.beginPath();
            if (i && points[i - 1].dragging) {
                ctx.moveTo(points[i - 1].x, points[i - 1].y);
            } else {
                ctx.moveTo(point.x - 1, point.y);
            }
            ctx.lineTo(point.x, point.y);
            ctx.closePath();
            ctx.stroke();
        });
    };

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
                    onTouchStart={handleMouseDown}
                    onTouchMove={handleMouseMove}
                    onTouchEnd={handleMouseUp}
                    onTouchCancel={handleMouseLeave}
                />
            </div>
            <div className="button-container">
                <button className={`btn btn-clear ${points.length === 0 ? 'disabled' : ''}`} onClick={clearCanvas} disabled={points.length === 0}>Очистить</button>
                <button className={`btn btn-predict ${points.length === 0 ? 'disabled' : ''}`} onClick={predictDigit} disabled={points.length === 0}>Распознать</button>
            </div>
            {prediction !== null && <p className="prediction">Предсказанная цифра: {prediction}</p>}
        </div>
    );
};

export default DigitRecognizer;
