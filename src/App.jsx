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
    const clickX = useRef([]);
    const clickY = useRef([]);
    const clickDrag = useRef([]);

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
        if (dragging && clickX.current.length) {
            context.moveTo(clickX.current[clickX.current.length - 1], clickY.current[clickY.current.length - 1]);
        } else {
            context.moveTo(x - 1, y);
        }
        context.lineTo(x, y);
        context.closePath();
        context.stroke();

        clickX.current.push(x);
        clickY.current.push(y);
        clickDrag.current.push(dragging);
    };

    const handleMouseDown = (e) => {
        const mouseX = e.clientX - canvasRef.current.getBoundingClientRect().left;
        const mouseY = e.clientY - canvasRef.current.getBoundingClientRect().top;
        setDrawing(true);
        setIsCanvasEmpty(false);
        recordPoint(mouseX, mouseY, false);
    };

    const handleMouseMove = (e) => {
        if (!drawing) return;
        const mouseX = e.clientX - canvasRef.current.getBoundingClientRect().left;
        const mouseY = e.clientY - canvasRef.current.getBoundingClientRect().top;
        recordPoint(mouseX, mouseY, true);
    };

    const handleMouseUp = () => {
        setDrawing(false);
    };

    const handleMouseLeave = () => {
        setDrawing(false);
    };

    const handleTouchStart = (e) => {
        const mouseX = e.touches[0].clientX - canvasRef.current.getBoundingClientRect().left;
        const mouseY = e.touches[0].clientY - canvasRef.current.getBoundingClientRect().top;
        setDrawing(true);
        setIsCanvasEmpty(false);
        recordPoint(mouseX, mouseY, false);
    };

    const handleTouchMove = (e) => {
        if (!drawing) return;
        const mouseX = e.touches[0].clientX - canvasRef.current.getBoundingClientRect().left;
        const mouseY = e.touches[0].clientY - canvasRef.current.getBoundingClientRect().top;
        recordPoint(mouseX, mouseY, true);
    };

    const handleTouchEnd = () => {
        setDrawing(false);
    };

    const handleTouchCancel = () => {
        setDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setPrediction(null);
        clickX.current = [];
        clickY.current = [];
        clickDrag.current = [];
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
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchCancel}
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
