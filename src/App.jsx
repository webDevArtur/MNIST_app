import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import './App.css';

const DigitRecognizer = () => {
    const [model, setModel] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [drawing, setDrawing] = useState(false);
    const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);
    const [canvasWidth] = useState(350);
    const [canvasHeight] = useState(350);

    const canvasRef = useRef(null);
    const lastPointRef = useRef(null);

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
        const context = canvas.getContext('2d');
        context.strokeStyle = "white";
        context.lineJoin = "round";
        context.lineWidth = 15;
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
        const canvas = canvasRef.current;
        const tensor = preprocessCanvas(canvas);
        const predictions = await model.predict(tensor).data();
        const results = Array.from(predictions);
        const maxIndex = results.indexOf(Math.max(...results));
        setPrediction(maxIndex);
    };

    const recordPoint = (x, y, dragging) => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.beginPath();
        if (lastPointRef.current && dragging) {
            const lastX = lastPointRef.current.x;
            const lastY = lastPointRef.current.y;
            context.moveTo(lastX, lastY);
        }
        context.lineTo(x, y);
        context.closePath();
        context.stroke();

        lastPointRef.current = { x, y };
    };

    const handleMouseDown = (e) => {
        const mouseX = e.clientX - e.target.getBoundingClientRect().left;
        const mouseY = e.clientY - e.target.getBoundingClientRect().top;
        setDrawing(true);
        setIsCanvasEmpty(false);
        recordPoint(mouseX, mouseY, false);
    };

    const handleMouseMove = (e) => {
        if (!drawing) return;
        const mouseX = e.clientX - e.target.getBoundingClientRect().left;
        const mouseY = e.clientY - e.target.getBoundingClientRect().top;
        recordPoint(mouseX, mouseY, true);
    };

    const handleMouseUp = () => {
        setDrawing(false);
        lastPointRef.current = null;
    };

    const handleMouseLeave = () => {
        setDrawing(false);
        lastPointRef.current = null;
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setPrediction(null);
        setIsCanvasEmpty(true);
    };

    return (
        <div className="app-container">
            <h2 className="app-title">Распознавание рукописных цифр</h2>
            <div className="canvas-container">
                <canvas
                    ref={canvasRef}
                    width={canvasWidth}
                    height={canvasHeight}
                    className="canvas"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
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
