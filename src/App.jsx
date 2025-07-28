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
    setTextElements(
      textElements.map((el, i) =>
        i === index ? { ...el, x: d.x, y: d.y } : el
      )
    );
  };

  const handleTextResizeStop = (index, ref, position) => {
    setTextElements(
      textElements.map((el, i) =>
        i === index
          ? {
              ...el,
              width: ref.style.width,
              height: ref.style.height,
              x: position.x,
              y: position.y,
            }
          : el
      )
    );
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
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
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
        const updatedImage = canvas.toDataURL("image/jpeg");
        setImageSrc(updatedImage);
      };
    }
  }, [brightness, saturation, contrast, originalImageSrc, isFlipped]);
  const [text, setText] = useState("");

  const handleTextChange = (index, newText) => {
    setTextElements(
      textElements.map((el, i) => (i === index ? { ...el, text: newText } : el))
    );
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

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.setAttribute("crossOrigin", "anonymous"); // to avoid CORS issues
      image.onload = () => resolve(image);
      image.onerror = (error) => reject(error);
      image.src = url;
    });

  const getRadianAngle = (degreeValue) => (degreeValue * Math.PI) / 180;

  const getCroppedImg = async (
    imageSrc,
    pixelCrop,
    rotation = 0,
    flip = { horizontal: false, vertical: false }
  ) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const rotRad = getRadianAngle(rotation);

    // calculate bounding box of rotated image
    const bBoxWidth =
      Math.abs(Math.cos(rotRad) * image.width) +
      Math.abs(Math.sin(rotRad) * image.height);
    const bBoxHeight =
      Math.abs(Math.sin(rotRad) * image.width) +
      Math.abs(Math.cos(rotRad) * image.height);

    // set canvas size to bounding box
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // rotate and flip context
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.translate(-image.width / 2, -image.height / 2);

    // draw original image onto rotated/flipped canvas
    ctx.drawImage(image, 0, 0);

    // get the cropped image from the transformed canvas
    const data = ctx.getImageData(
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height
    );

    // create a new canvas with desired cropped size
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = pixelCrop.width;
    cropCanvas.height = pixelCrop.height;

    const cropCtx = cropCanvas.getContext("2d");
    cropCtx.putImageData(data, 0, 0);

    // return blob
    return new Promise((resolve) => {
      cropCanvas.toBlob((blob) => resolve(blob), "image/png");
    });
  };

  const rotateSize = (width, height, rotation) => {
    const rotRad = getRadianAngle(rotation);
    return {
      width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height)
    };
  };

  const shareImage = async () => {
    try {
      if (!originalImageSrc || !croppedAreaPixels) return;
      
      const image = await createImage(originalImageSrc);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Destructure flip from component state
      const { flip } = this.state;
      
      // Apply same transformations as preview
      const rotRad = getRadianAngle(rotation);
      const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        image.width,
        image.height,
        rotation
      );
      
      canvas.width = bBoxWidth;
      canvas.height = bBoxHeight;
      
      ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
      ctx.rotate(rotRad);
      
      // Apply flip if needed
      ctx.scale(
        flip.horizontal ? -1 : 1,
        flip.vertical ? -1 : 1
      );
      
      ctx.drawImage(
        image,
        -image.width / 2,
        -image.height / 2
      );
      
      const croppedCanvas = document.createElement('canvas');
      const croppedCtx = croppedCanvas.getContext('2d');
      
      croppedCanvas.width = croppedAreaPixels.width;
      croppedCanvas.height = croppedAreaPixels.height;
      
      croppedCtx.drawImage(
        canvas,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );
      
      croppedCanvas.toBlob(async (blob) => {
        if (navigator.share) {
          // Mobile share
           const file = new File([blob], 'edited-photo.png', {
             type: 'image/png',
             lastModified: Date.now()
           });
           
           if (navigator.canShare && navigator.canShare({ files: [file] })) {
             await navigator.share({
               title: 'Edited Photo',
               files: [file],
               text: 'Check out my edited photo!'
             });
           } else {
             // Fallback for browsers that don't support file sharing
             saveAs(blob, 'edited-photo.png');
           }
        } else {
          // Fallback to download
          saveAs(blob, 'edited-photo.png');
        }
      }, 'image/png');
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const downloadImage = async () => {
    if (!originalImageSrc || !croppedAreaPixels) return;

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = originalImageSrc;
    await image.decode();

    // Create an off-screen canvas for filtering, flipping and rotating
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    // Calculate dimensions for rotated image
    const rotRad = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rotRad));
    const cos = Math.abs(Math.cos(rotRad));

    const rotatedWidth = image.width * cos + image.height * sin;
    const rotatedHeight = image.width * sin + image.height * cos;

    // Set canvas to accommodate rotation
    tempCanvas.width = rotatedWidth;
    tempCanvas.height = rotatedHeight;

    tempCtx.save();

    // Move to center for transformations
    tempCtx.translate(rotatedWidth / 2, rotatedHeight / 2);

    // Apply rotation
    tempCtx.rotate(rotRad);

    // Apply flip if needed
    if (isFlipped) {
      tempCtx.scale(-1, 1);
    }

    // Apply filters BEFORE drawing the image
    const filterString = [
      `brightness(${brightness}%)`,
      `contrast(${contrast}%)`,
      `saturate(${saturation}%)`,
    ].join(" ");

    if (filter && filter !== "none") {
      tempCtx.filter = `${filterString} ${filter}`;
    } else {
      tempCtx.filter = filterString;
    }

    // Draw original image with filters applied
    tempCtx.drawImage(image, -image.width / 2, -image.height / 2);
    tempCtx.restore();

    // Now crop from the transformed canvas
    const canvas = document.createElement("canvas");
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    const ctx = canvas.getContext("2d");

    // Calculate the offset due to rotation
    const offsetX = (rotatedWidth - image.width) / 2;
    const offsetY = (rotatedHeight - image.height) / 2;

    ctx.drawImage(
      tempCanvas,
      croppedAreaPixels.x + offsetX,
      croppedAreaPixels.y + offsetY,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    // Draw frame if provided
    if (frameSrc) {
      const frameImage = new Image();
      frameImage.crossOrigin = "anonymous";
      frameImage.src = frameSrc;
      await frameImage.decode();
      ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
    }

    // Add text elements to the final image
    textElements.forEach((textElement) => {
      ctx.save();
      ctx.fillStyle = textStyle.color;
      ctx.font = `${textStyle.fontSize}px ${textStyle.fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Add text background
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      const textMetrics = ctx.measureText(textElement.text);
      const textWidth = textMetrics.width + 16; // padding
      const textHeight = textStyle.fontSize + 16; // padding

      ctx.fillRect(
        textElement.x - textWidth / 2,
        textElement.y - textHeight / 2,
        textWidth,
        textHeight
      );

      // Draw text
      ctx.fillStyle = textStyle.color;
      ctx.fillText(textElement.text, textElement.x, textElement.y);
      ctx.restore();
    });

    // Convert canvas to blob and download
    canvas.toBlob(
      (blob) => {
        if (blob) {
          saveAs(blob, "edited-image.jpg");
        }
      },
      "image/jpeg",
      0.95
    );
  };

  useEffect(() => {
    if (originalImageSrc) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const image = new Image();
      image.src = originalImageSrc;
      image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;

        ctx.save();

        // Apply transformations
        ctx.translate(canvas.width / 2, canvas.height / 2);

        if (rotation !== 0) {
          ctx.rotate((rotation * Math.PI) / 180);
        }

        if (isFlipped) {
          ctx.scale(-1, 1);
        }

        ctx.translate(-canvas.width / 2, -canvas.height / 2);

        // Apply filters
        const filterString = `brightness(${brightness}%) saturate(${saturation}%) contrast(${contrast}%)`;
        ctx.filter =
          filter && filter !== "none"
            ? `${filterString} ${filter}`
            : filterString;

        ctx.drawImage(image, 0, 0);
        ctx.restore();

        // Update preview
        const updatedImage = canvas.toDataURL("image/jpeg");
        setImageSrc(updatedImage);
      };
    }
  }, [
    brightness,
    saturation,
    contrast,
    filter,
    rotation,
    isFlipped,
    originalImageSrc,
  ]);

  const frameOptions = [
    "/frames/frame1.png",
    "/frames/frame2.png",
    "/frames/frame3.png",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-slate-100 flex justify-center items-center px-4 py-8">
      <div className="w-full max-w-[500px] bg-white rounded-3xl shadow-2xl p-5 border border-gray-200">
        <div className="relative w-full aspect-square bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center">
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
                cropSize={{ width: 440, height: 440 }}
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
                    height: textElement.height || 100,
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
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    padding: "8px",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {textElement.text}
                  <button
                    onClick={() => {
                      setTextElements(
                        textElements.filter((_, i) => i !== index)
                      );
                    }}
                    style={{
                      position: "absolute",
                      top: "-10px",
                      right: "-10px",
                      background: "red",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      cursor: "pointer",
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brightness: {brightness}%
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Saturation: {saturation}%
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contrast: {contrast}%
              </label>
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

          {/* <div className="space-y-2">
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
          </div> */}
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
          <div className="flex gap-2">
            <button
              onClick={downloadImage}
              className="mt-6 w-full bg-blue-600 text-white text-base py-3 rounded-2xl font-semibold shadow-md hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <span className="text-lg">⬇️</span> Download Image
            </button>
            <button
              onClick={shareImage}
              className="mt-6 w-full bg-green-600 text-white text-base py-3 rounded-2xl font-semibold shadow-md hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <span className="text-lg">↗️</span> Share Image
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
