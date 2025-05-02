import ReactDOM from "react-dom/client";
import React from "react";

export const generateTextureFromReactComponent = (
  Component: React.ComponentType<any>,
  props: any,
  textureKey: string,
  scene: Phaser.Scene
): Promise<void> => {
  return new Promise((resolve) => {
    // Create a temporary container for rendering the component
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.opacity = '0';
    tempContainer.style.pointerEvents = 'none';
    document.body.appendChild(tempContainer);
    
    // Use requestAnimationFrame to avoid React rendering conflicts
    requestAnimationFrame(() => {
      const root = ReactDOM.createRoot(tempContainer);
      root.render(
        <Component 
          {...props}
          onRender={(imageData: string) => {
            // Once rendered, add the imageData as a texture to Phaser
            scene.textures.addBase64(textureKey, imageData);
            
            // Clean up with requestAnimationFrame to avoid React warnings
            requestAnimationFrame(() => {
              root.unmount();
              if (document.body.contains(tempContainer)) {
                document.body.removeChild(tempContainer);
              }
              resolve();
            });
          }}
        />
      );
    });
  });
};