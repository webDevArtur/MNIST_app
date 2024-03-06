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

    const canvasRef = useMemo(() => ({
        x: document.getElementById('canvas').getBoundingClientRect().left,
        y: document.getElementById('canvas').getBoundingClientRect().top
    }), []);

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

    const preprocessCanvas = useCallback((image) => {
        const tensor = tf.browser.fromPixels(image)
            .resizeNearestNeighbor([28, 28])
            .mean(2)
            .expandDims(2)
            .expandDims()
            .toFloat();
        return tensor.div(255.0);
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

    const handleMouseDown = useCallback((e) => {
        const mouseX = e.clientX - canvasRef.x;
        const mouseY = e.clientY - canvasRef.y;
        setDrawing(true);
        setClickX([...clickX, mouseX]);
        setClickY([...clickY, mouseY]);
        setClickDrag([...clickDrag, false]);
        setIsCanvasEmpty(false);
    }, [canvasRef, clickX, clickY, clickDrag]);

    const handleMouseMove = useCallback((e) => {
        if (!drawing) return;
        const mouseX = e.clientX - canvasRef.x;
        const mouseY = e.clientY - canvasRef.y;
        setClickX([...clickX, mouseX]);
        setClickY([...clickY, mouseY]);
        setClickDrag([...clickDrag, true]);
        redraw();
    }, [drawing, canvasRef, clickX, clickY, clickDrag, redraw]);

    const handleMouseUp = useCallback(() => {
        setDrawing(false);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setDrawing(false);
    }, []);

    const handleTouchStart = useCallback((e) => {
        const mouseX = e.touches[0].clientX - canvasRef.x;
        const mouseY = e.touches[0].clientY - canvasRef.y;
        setDrawing(true);
        setClickX([...clickX, mouseX]);
        setClickY([...clickY, mouseY]);
        setClickDrag([...clickDrag, false]);
        setIsCanvasEmpty(false);
    }, [canvasRef, clickX, clickY, clickDrag]);

    const handleTouchMove = useCallback((e) => {
        if (!drawing) return;
        const mouseX = e.touches[0].clientX - canvasRef.x;
        const mouseY = e.touches[0].clientY - canvasRef.y;
        setClickX([...clickX, mouseX]);
        setClickY([...clickY, mouseY]);
        setClickDrag([...clickDrag, true]);
        redraw();
    }, [drawing, canvasRef, clickX, clickY, clickDrag, redraw]);

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
