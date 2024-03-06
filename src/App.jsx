import React, {useState, useEffect, useRef} from 'react';
import * as tf from '@tensorflow/tfjs';
import './App.css';
import debounce from 'lodash/debounce';

const DigitRecognizer = () => {
    const [model, setModel] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);
    const [inputType, setInputType] = useState(null);
    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const drawingRef = useRef(false);
    const clickXRef = useRef([]);
    const clickYRef = useRef([]);
    const clickDragRef = useRef([]);

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
        ctxRef.current = canvas.getContext('2d');
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

    const handleStart = (e) => {
        const mouseX = e.clientX || e.touches[0].clientX;
        const mouseY = e.clientY || e.touches[0].clientY;
        drawingRef.current = true;
        clickXRef.current.push(mouseX - canvasRef.current.getBoundingClientRect().left);
        clickYRef.current.push(mouseY - canvasRef.current.getBoundingClientRect().top);
        clickDragRef.current.push(false);
        setIsCanvasEmpty(false);
        setInputType(e.type.startsWith('touch') ? 'touch' : 'mouse');
    };

    const debouncedHandleMove = useRef(
        debounce((e) => handleMove(e), 10)
    ).current;

    const handleMove = (e) => {
        if (!drawingRef.current || e.type.startsWith('touch') && inputType !== 'touch' || e.type.startsWith('mouse') && inputType !== 'mouse') return;
        const mouseX = e.clientX || e.touches[0].clientX;
        const mouseY = e.clientY || e.touches[0].clientY;
        clickXRef.current.push(mouseX - canvasRef.current.getBoundingClientRect().left);
        clickYRef.current.push(mouseY - canvasRef.current.getBoundingClientRect().top);
        clickDragRef.current.push(true);
        redraw();
    };

    const handleEnd = () => {
        drawingRef.current = false;
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setPrediction(null);
        clickXRef.current = [];
        clickYRef.current = [];
        clickDragRef.current = [];
        setIsCanvasEmpty(true);
    };

    const redraw = () => {
        const ctx = ctxRef.current;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.strokeStyle = "white";
        ctx.lineJoin = "round";
        ctx.lineWidth = 15;

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

    return (
        <div className="app-container">
            <h2 className="app-title">Распознавание рукописных цифр</h2>
            <div className="canvas-container">
                <canvas
                    ref={canvasRef}
                    width={350}
                    height={350}
                    className="canvas"
                    onMouseDown={handleStart}
                    onMouseMove={debouncedHandleMove}
                    onMouseUp={handleEnd}
                    onMouseLeave={handleEnd}
                    onTouchStart={handleStart}
                    onTouchMove={debouncedHandleMove}
                    onTouchEnd={handleEnd}
                    onTouchCancel={handleEnd}
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
