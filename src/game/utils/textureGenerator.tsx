import React from 'react';
import { createRoot } from 'react-dom/client';

export async function generateTextureFromReactComponent(
  Component: React.ComponentType<any>,
  props: any,
  textureKey: string,
  scene: Phaser.Scene
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Check if texture already exists and remove it
      if (scene.textures.exists(textureKey)) {
        console.warn(`Texture ${textureKey} already exists, removing old texture`);
        scene.textures.remove(textureKey);
      }

      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      document.body.appendChild(container);

      const root = createRoot(container);

      const handleRender = (imageData: string) => {
        try {
          scene.textures.addBase64(textureKey, imageData);
          
          // Cleanup
          root.unmount();
          document.body.removeChild(container);
          
          resolve();
        } catch (error) {
          console.error(`Failed to add texture ${textureKey}:`, error);
          
          // Cleanup on error
          root.unmount();
          document.body.removeChild(container);
          
          reject(error);
        }
      };

      root.render(React.createElement(Component, { ...props, onRender: handleRender }));

      // Timeout fallback
      setTimeout(() => {
        try {
          root.unmount();
          document.body.removeChild(container);
        } catch (e) {
          // Container might already be removed
        }
        reject(new Error(`Texture generation timeout for ${textureKey}`));
      }, 5000);

    } catch (error) {
      console.error(`Error generating texture ${textureKey}:`, error);
      reject(error);
    }
  });
}