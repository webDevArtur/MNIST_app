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

    const virtualCanvasRef = useRef(null);
    const visibleCanvasRef = useRef(null);

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
        const canvas = visibleCanvasRef.current;
        const tensor = preprocessCanvas(canvas);
        const predictions = await model.predict(tensor).data();
        const results = Array.from(predictions);
        const maxIndex = results.indexOf(Math.max(...results));
        setPrediction(maxIndex);
    };

    const handleMouseDown = (e) => {
        setDrawing(true);
        setIsCanvasEmpty(false);
        recordPoint(e);
    };

    const handleMouseMove = (e) => {
        if (drawing) {
            recordPoint(e);
        }
    };

    const handleMouseUp = () => {
        setDrawing(false);
    };

    const handleMouseLeave = () => {
        setDrawing(false);
    };

    const handleTouchStart = (e) => {
        setDrawing(true);
        setIsCanvasEmpty(false);
        recordPoint(e.touches[0]);
    };

    const handleTouchMove = (e) => {
        if (drawing) {
            recordPoint(e.touches[0]);
        }
    };

    const handleTouchEnd = () => {
        setDrawing(false);
    };

    const handleTouchCancel = () => {
        setDrawing(false);
    };

    const recordPoint = (e) => {
        const mouseX = e.clientX - e.target.getBoundingClientRect().left;
        const mouseY = e.clientY - e.target.getBoundingClientRect().top;
        const context = virtualCanvasRef.current.getContext('2d');
        context.strokeStyle = "white";
        context.lineJoin = "round";
        context.lineWidth = 15;

        context.beginPath();
        if (drawing) {
            context.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        } else {
            context.moveTo(mouseX, mouseY);
        }
        context.lineTo(mouseX, mouseY);
        context.closePath();
        context.stroke();
    };

    const clearCanvas = () => {
        const context = virtualCanvasRef.current.getContext('2d');
        context.clearRect(0, 0, canvasWidth, canvasHeight);
        setPrediction(null);
        setIsCanvasEmpty(true);
    };

    const copyVirtualCanvasToVisibleCanvas = () => {
        const virtualCanvas = virtualCanvasRef.current;
        const visibleCanvas = visibleCanvasRef.current;
        const context = visibleCanvas.getContext('2d');
        context.drawImage(virtualCanvas, 0, 0);
    };

    useEffect(() => {
        if (!drawing) {
            copyVirtualCanvasToVisibleCanvas();
        }
    }, [drawing]);

    return (
        <div className="app-container">
            <h2 className="app-title">Распознавание рукописных цифр</h2>
            <div className="canvas-container">
                <canvas
                    ref={virtualCanvasRef}
                    width={canvasWidth}
                    height={canvasHeight}
                    className="canvas"
                    style={{ display: 'none' }}
                />
                <canvas
                    ref={visibleCanvasRef}
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
