// const getCroppedImage = async (imgSrc, crop, zoom, rotation, isFlipped) => {
//   const image = new Image();
//   image.src = imgSrc;
//   await image.decode();

//   const radians = (rotation * Math.PI) / 180;

//   const canvas = document.createElement("canvas");
//   const ctx = canvas.getContext("2d");

//   const safeArea = Math.max(image.width, image.height) * 2;

//   canvas.width = safeArea;
//   canvas.height = safeArea;

//   ctx.translate(safeArea / 2, safeArea / 2);
//   ctx.rotate(radians);
//   if (isFlipped) ctx.scale(-1, 1);
//   ctx.translate(-image.width / 2, -image.height / 2);

//   ctx.drawImage(image, 0, 0);

//   // calculate cropped area
//   const cropX = crop.x;
//   const cropY = crop.y;
//   const cropWidth = crop.width;
//   const cropHeight = crop.height;

//   const scaledCropX = cropX * zoom;
//   const scaledCropY = cropY * zoom;
//   const scaledCropWidth = cropWidth * zoom;
//   const scaledCropHeight = cropHeight * zoom;

//   const outputCanvas = document.createElement("canvas");
//   outputCanvas.width = cropWidth;
//   outputCanvas.height = cropHeight;
//   const outputCtx = outputCanvas.getContext("2d");

//   outputCtx.drawImage(
//     canvas,
//     scaledCropX,
//     scaledCropY,
//     scaledCropWidth,
//     scaledCropHeight,
//     0,
//     0,
//     cropWidth,
//     cropHeight
//   );

//   return new Promise((resolve) => {
//     outputCanvas.toBlob((blob) => {
//       resolve(blob);
//     }, "image/png");
//   });
// };
