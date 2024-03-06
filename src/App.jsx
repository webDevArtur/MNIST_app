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
    const drawingRef = useRef(false);
    const clickX = useRef([]);
    const clickY = useRef([]);

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

    const recordPoint = (x, y) => {
        clickX.current.push(x);
        clickY.current.push(y);
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        const mouseX = e.clientX - e.target.getBoundingClientRect().left;
        const mouseY = e.clientY - e.target.getBoundingClientRect().top;
        setDrawing(true);
        setIsCanvasEmpty(false);
        recordPoint(mouseX, mouseY);
    };

    const handleMouseMove = (e) => {
        e.preventDefault();
        if (!drawing) return;
        const mouseX = e.clientX - e.target.getBoundingClientRect().left;
        const mouseY = e.clientY - e.target.getBoundingClientRect().top;
        recordPoint(mouseX, mouseY);
        redraw();
    };

    const handleMouseUp = () => {
        setDrawing(false);
    };

    const redraw = () => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.beginPath();
        context.moveTo(clickX.current[0], clickY.current[0]);
        for (let i = 1; i < clickX.current.length; i++) {
            context.lineTo(clickX.current[i], clickY.current[i]);
        }
        context.stroke();
        context.closePath();
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setPrediction(null);
        clickX.current = [];
        clickY.current = [];
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
                    onTouchStart={handleMouseDown}
                    onTouchMove={handleMouseMove}
                    onTouchEnd={handleMouseUp}
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
