import React, {useState, useEffect} from 'react';
import * as tf from '@tensorflow/tfjs';
import './App.css';

const DigitRecognizer = () => {
    const [model, setModel] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [drawing, setDrawing] = useState(false);
    const [lastX, setLastX] = useState(null);
    const [lastY, setLastY] = useState(null);
    const [canvasWidth] = useState(350);
    const [canvasHeight] = useState(350);
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

    const handleMouseDown = (e) => {
        const mouseX = e.clientX - e.target.getBoundingClientRect().left;
        const mouseY = e.clientY - e.target.getBoundingClientRect().top;
        setLastX(mouseX);
        setLastY(mouseY);
        setDrawing(true);
        setIsCanvasEmpty(false);
    };

    const handleMouseMove = (e) => {
        if (!drawing) return;
        const mouseX = e.clientX - e.target.getBoundingClientRect().left;
        const mouseY = e.clientY - e.target.getBoundingClientRect().top;
        setLastX(mouseX);
        setLastY(mouseY);
        redraw(mouseX, mouseY);
    };

    const handleMouseUp = () => {
        setDrawing(false);
    };

    const handleMouseLeave = () => {
        setDrawing(false);
    };

    const handleTouchStart = (e) => {
        const mouseX = e.touches[0].clientX - e.target.getBoundingClientRect().left;
        const mouseY = e.touches[0].clientY - e.target.getBoundingClientRect().top;
        setLastX(mouseX);
        setLastY(mouseY);
        setDrawing(true);
        setIsCanvasEmpty(false);
    };

    const handleTouchMove = (e) => {
        if (!drawing) return;
        const mouseX = e.touches[0].clientX - e.target.getBoundingClientRect().left;
        const mouseY = e.touches[0].clientY - e.target.getBoundingClientRect().top;
        setLastX(mouseX);
        setLastY(mouseY);
        redraw(mouseX, mouseY);
    };


    const handleTouchEnd = () => {
        setDrawing(false);
    };

    const handleTouchCancel = () => {
        setDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setPrediction(null);
        setIsCanvasEmpty(true);
    };

    const redraw = (x, y) => {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = "white";
        ctx.lineJoin = "round";
        ctx.lineWidth = 10;

        ctx.beginPath();
        if (lastX && lastY) {
            ctx.moveTo(lastX, lastY);
        }
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.stroke();
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
