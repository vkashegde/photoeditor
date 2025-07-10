/* eslint-disable no-unused-vars */
/* App.jsx */

import React, { useState, useRef, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { saveAs } from "file-saver";
import { Rnd } from "react-rnd";

const App = () => {
  const [imageSrc, setImageSrc] = useState(null);
  const [originalImageSrc, setOriginalImageSrc] = useState(null);
  const [textElements, setTextElements] = useState([]);
  
  const handleTextDragStop = (index, e, d) => {
    setTextElements(textElements.map((el, i) => 
      i === index ? { ...el, x: d.x, y: d.y } : el
    ));
  };
  
  const handleTextResizeStop = (index, ref, position) => {
    setTextElements(textElements.map((el, i) => 
      i === index ? { 
        ...el, 
        width: ref.style.width, 
        height: ref.style.height,
        x: position.x,
        y: position.y
      } : el
    ));
  };
  const [frameSrc, setFrameSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [filter, setFilter] = useState("none");
  const [brightness, setBrightness] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [contrast, setContrast] = useState(100);
  
  // Re-render when adjustments change
   useEffect(() => {
     if (originalImageSrc) {
       const canvas = document.createElement('canvas');
       const ctx = canvas.getContext('2d');
       const image = new Image();
       image.src = originalImageSrc;
       image.onload = () => {
         canvas.width = image.width;
         canvas.height = image.height;
         
         // Apply adjustments
         ctx.save();
         if (isFlipped) {
           ctx.translate(image.width, 0);
           ctx.scale(-1, 1);
         }
         if (rotation !== 0) {
           ctx.translate(image.width / 2, image.height / 2);
           ctx.rotate((rotation * Math.PI) / 180);
           ctx.translate(-image.width / 2, -image.height / 2);
         }
         ctx.filter = `brightness(${brightness}%) saturate(${saturation}%) contrast(${contrast}%)`;
         ctx.drawImage(image, 0, 0);
         ctx.restore();
         
         // Update preview
         const updatedImage = canvas.toDataURL('image/jpeg');
         setImageSrc(updatedImage);
       };
     }
   }, [brightness, saturation, contrast, originalImageSrc, isFlipped]);
  const [text, setText] = useState("");

  const handleTextChange = (index, newText) => {
    setTextElements(textElements.map((el, i) => 
      i === index ? { ...el, text: newText } : el
    ));
  };




  const [textStyle, setTextStyle] = useState({
    color: "#ffffff",
    fontSize: 24,
    fontFamily: "'Inter', sans-serif",
  });
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
  const textRef = useRef(null);
  const [activeTab, setActiveTab] = useState("crop");

  const renderActiveTab = () => {
    switch (activeTab) {
      case "crop":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zoom
              </label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rotation
              </label>
              <input
                type="range"
                min="0"
                max="360"
                value={rotation}
                onChange={(e) => setRotation(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        );
      case "text":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Text
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Add text to image"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    console.log("CROP", croppedAreaPixels);
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const onFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageDataUrl = URL.createObjectURL(file);
      setOriginalImageSrc(imageDataUrl);
      setImageSrc(imageDataUrl);
    }
  };

  const downloadImage = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    const image = new Image();
    image.src = imageSrc;
    await image.decode();

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas to cropped dimensions
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    // Apply image transformations
    ctx.save();
    
    // Apply transformations to the cropped area only
    if (isFlipped || rotation !== 0) {
      ctx.save();
      ctx.translate(croppedAreaPixels.width / 2, croppedAreaPixels.height / 2);
      if (isFlipped) {
        ctx.scale(-1, 1);
      }
      if (rotation !== 0) {
        ctx.rotate((rotation * Math.PI) / 180);
      }
      ctx.translate(-croppedAreaPixels.width / 2, -croppedAreaPixels.height / 2);
    }
    
    // Apply image adjustments
    let filterString = '';
    if (filter !== 'none') {
      filterString += `${filter} `;
    }
    filterString += `brightness(${brightness}%) saturate(${saturation}%) contrast(${contrast}%)`;
    ctx.filter = filterString;
    
    // Draw the cropped area
    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    ctx.restore();

    // Draw frame if any
    if (frameSrc) {
      const frameImage = new Image();
      frameImage.src = frameSrc;
      await frameImage.decode();

      ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
    }

    // Draw text if any
    if (textElements && textElements.length > 0) {
      textElements.forEach((textElement) => {
        if (textElement && textElement.style && textElement.position) {
          ctx.font = `${textElement.style.fontSize}px ${
            textElement.style.fontFamily || "sans-serif"
          }`;
          ctx.fillStyle = textElement.style.color || "#000000";
          ctx.textAlign = "center";
          ctx.fillText(
            textElement.content || "",
            textElement.position.x || 0,
            textElement.position.y || 0
          );
        }
      });
    }

    // Save image
    canvas.toBlob((blob) => {
      if (blob) saveAs(blob, "cropped-photo.png");
    });
  };

  const frameOptions = [
    "/frames/frame1.png",
    "/frames/frame2.png",
    "/frames/frame3.png",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-slate-100 flex justify-center items-center px-4 py-8">
      <div className="w-full max-w-[500px] bg-white rounded-3xl shadow-2xl p-5 border border-gray-200">
        <div 
          className="relative w-full aspect-square bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center"

        >
          {!imageSrc ? (
            <label className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 cursor-pointer">
              <div className="text-4xl mb-2">🖼️</div>
              <p className="text-sm font-medium">Tap to upload image</p>
              <input
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <>
              <Cropper
                cropSize={{ width: 400, height: 400 }}
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                rotation={rotation}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="rect"
                showGrid={false}
                restrictPosition={true}
                style={{
                  containerStyle: { width: "100%", height: "100%" },
                  mediaStyle: {
                    filter,
                    transform: isFlipped ? "scaleX(-1)" : "none",
                  },
                }}
              />
              {frameSrc && (
                <img
                  src={frameSrc}
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  alt="frame"
                />
              )}
              {textElements.map((textElement, index) => (
                <Rnd
                  key={index}
                  size={{ 
                    width: textElement.width || 200, 
                    height: textElement.height || 100 
                  }}
                  position={{ x: textElement.x || 50, y: textElement.y || 50 }}
                  onDragStop={(e, d) => handleTextDragStop(index, e, d)}
                  onResizeStop={(e, direction, ref, delta, position) => 
                    handleTextResizeStop(index, ref, position)
                  }
                  bounds="parent"
                  style={{
                    color: textStyle.color,
                    fontSize: textStyle.fontSize,
                    fontFamily: textStyle.fontFamily,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    padding: '8px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {textElement.text}
                  <button
                    onClick={() => {
                      setTextElements(textElements.filter((_, i) => i !== index));
                    }}
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '-10px',
                      background: 'red',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                </Rnd>
              ))}
              {text && (
                <div
                  className="absolute select-none"
                  style={{
                    top: textPosition.y,
                    left: textPosition.x,
                    transform: "translate(-50%, -50%)",
                    color: textStyle.color,
                    fontSize: `${textStyle.fontSize}px`,
                  }}
                  ref={textRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => setText(e.currentTarget.textContent)}
                  draggable
                  onDragEnd={(e) => {
                    setTextPosition({
                      x: e.clientX - e.target.offsetParent.offsetLeft,
                      y: e.clientY - e.target.offsetParent.offsetTop,
                    });
                  }}
                >
                  {text}
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <select
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="none">Select Filter</option>
            <option value="grayscale(1)">Grayscale</option>
            <option value="sepia(1)">Sepia</option>
            <option value="brightness(1.2)">Brighten</option>
            <option value="contrast(1.5)">High Contrast</option>
          </select>

          <div className="space-y-2 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brightness: {brightness}%</label>
              <input
                type="range"
                min="0"
                max="200"
                value={brightness}
                onChange={(e) => setBrightness(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Saturation: {saturation}%</label>
              <input
                type="range"
                min="0"
                max="200"
                value={saturation}
                onChange={(e) => setSaturation(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contrast: {contrast}%</label>
              <input
                type="range"
                min="0"
                max="200"
                value={contrast}
                onChange={(e) => setContrast(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className="flex-1 bg-gray-100 border border-gray-300 rounded-xl py-2 text-sm hover:bg-gray-200"
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
            >
              🔄 Rotate
            </button>
            <button
              className="flex-1 bg-gray-100 border border-gray-300 rounded-xl py-2 text-sm hover:bg-gray-200"
              onClick={() => setIsFlipped((prev) => !prev)}
            >
              ↔️ Flip
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm"
              placeholder="Add text to image"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex gap-2">
              <input
                type="color"
                value={textStyle.color}
                onChange={(e) =>
                  setTextStyle({ ...textStyle, color: e.target.value })
                }
              />
              <input
                type="range"
                min="12"
                max="60"
                value={textStyle.fontSize}
                onChange={(e) =>
                  setTextStyle({
                    ...textStyle,
                    fontSize: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className="flex overflow-x-auto mt-4 gap-3 pb-1">
          {frameOptions.map((frame) => (
            <img
              height={"80px"}
              width={"80px"}
              key={frame}
              src={frame}
              onClick={() => setFrameSrc(frame)}
              className={`w-14 h-14 shrink-0 border-2 rounded-xl object-contain cursor-pointer transition-transform hover:scale-105 ${
                frameSrc === frame ? "border-blue-500" : "border-gray-300"
              }`}
              alt="frame"
            />
          ))}
        </div>

        {imageSrc && (
          <button
            onClick={downloadImage}
            className="mt-6 w-full bg-blue-600 text-white text-base py-3 rounded-2xl font-semibold shadow-md hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <span className="text-lg">⬇️</span> Download Image
          </button>
        )}
      </div>
    </div>
  );
};

export default App;
