import { useRef, useCallback } from "react";
import * as THREE from "three";

/**
 * Configuration for click detection and API calls
 */
export interface ClickDetectionConfig {
  /**
   * Base URL for the API endpoint
   * The part identifier will be appended: ${apiEndpoint}/${partIdentifier}
   */
  apiEndpoint: string;
  
  /**
   * Optional mapping function to convert object names to part identifiers
   * If not provided, uses the object's name directly
   */
  mapObjectToPartId?: (objectName: string) => string | null;
  
  /**
   * Optional callback when a part is clicked
   */
  onPartClick?: (partId: string, partData: any) => void;
  
  /**
   * Optional callback for errors
   */
  onError?: (error: Error) => void;
}

/**
 * Hook for handling click detection on Three.js hand model parts
 * Integrates with your existing Three.js scene
 */
export function useHandClickDetection(config: ClickDetectionConfig) {
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  /**
   * Default mapping function that extracts part identifier from object name
   * You can override this with your own mapping logic
   */
  const defaultMapObjectToPartId = useCallback((objectName: string): string | null => {
    if (!objectName) return null;
    
    const lowerName = objectName.toLowerCase();
    
    // Common patterns for hand parts in Blender exports
    // Adjust these patterns based on how you named your parts in Blender
    
    // Example patterns:
    // - "Thumb_Metacarpal" -> "thumb_metacarpal"
    // - "Index_Proximal" -> "index_proximal"
    // - "hand_part_thumb_distal" -> "thumb_distal"
    
    // Remove common prefixes/suffixes
    let partId = lowerName
      .replace(/^(hand_|left_|right_|bone_)/, '')
      .replace(/_bone$|_mesh$|_part$/, '')
      .trim();
    
    // If empty or just whitespace, return null
    if (!partId) return null;
    
    return partId;
  }, []);

  /**
   * Fetches bone/part data from your friend's API
   */
  const fetchPartData = useCallback(async (partId: string): Promise<any> => {
    try {
      const endpoint = `${config.apiEndpoint}/${partId}`;
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText} (${response.status})`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (config.onError) {
        config.onError(err);
      } else {
        console.error("Error fetching part data:", err);
      }
      throw err;
    }
  }, [config.apiEndpoint, config.onError]);

  /**
   * Sets up click detection for your Three.js scene
   * Call this in your component and pass the renderer's DOM element
   */
  const setupClickDetection = useCallback((
    renderer: THREE.WebGLRenderer,
    camera: THREE.Camera,
    scene: THREE.Scene | THREE.Group
  ) => {
    const handleClick = async (event: MouseEvent) => {
      const domElement = renderer.domElement;
      const rect = domElement.getBoundingClientRect();

      // Calculate mouse position in normalized device coordinates
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Update raycaster
      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      // Get all meshes from the scene/group
      const meshes: THREE.Object3D[] = [];
      if (scene instanceof THREE.Scene) {
        scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            meshes.push(child);
          }
        });
      } else if (scene instanceof THREE.Group) {
        scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            meshes.push(child);
          }
        });
      }

      // Find intersections
      const intersects = raycasterRef.current.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;

        // Find the part identifier
        // First, check the clicked object's name
        // Then traverse up the parent chain if needed
        let partId: string | null = null;
        let currentObject: THREE.Object3D | null = clickedObject;

        while (currentObject && !partId) {
          const objectName = currentObject.name;
          if (objectName) {
            // Use custom mapping function or default
            const mapper = config.mapObjectToPartId || defaultMapObjectToPartId;
            partId = mapper(objectName);
            if (partId) break;
          }
          currentObject = currentObject.parent;
        }

        if (partId) {
          try {
            // Fetch data from API
            const partData = await fetchPartData(partId);

            // Call optional callback
            if (config.onPartClick) {
              config.onPartClick(partId, partData);
            }

            // Return for additional handling if needed
            return { partId, partData, object: clickedObject };
          } catch (error) {
            // Error already handled in fetchPartData
            console.error("Failed to fetch part data for:", partId);
          }
        } else {
          console.warn("Clicked object found but part identifier could not be determined:", clickedObject.name);
        }
      }

      return null;
    };

    // Add click event listener to renderer's DOM element
    renderer.domElement.addEventListener("click", handleClick);

    // Return cleanup function
    return () => {
      renderer.domElement.removeEventListener("click", handleClick);
    };
  }, [config, defaultMapObjectToPartId, fetchPartData]);

  /**
   * Manually trigger click detection at specific coordinates
   * Useful for testing or programmatic clicks
   */
  const detectClickAt = useCallback((
    normalizedX: number,
    normalizedY: number,
    camera: THREE.Camera,
    scene: THREE.Scene | THREE.Group
  ): Promise<{ partId: string; partData: any; object: THREE.Object3D } | null> => {
    return new Promise(async (resolve) => {
      mouseRef.current.x = normalizedX;
      mouseRef.current.y = normalizedY;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      const meshes: THREE.Object3D[] = [];
      if (scene instanceof THREE.Scene) {
        scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            meshes.push(child);
          }
        });
      } else if (scene instanceof THREE.Group) {
        scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            meshes.push(child);
          }
        });
      }

      const intersects = raycasterRef.current.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        let partId: string | null = null;
        let currentObject: THREE.Object3D | null = clickedObject;

        while (currentObject && !partId) {
          const objectName = currentObject.name;
          if (objectName) {
            const mapper = config.mapObjectToPartId || defaultMapObjectToPartId;
            partId = mapper(objectName);
            if (partId) break;
          }
          currentObject = currentObject.parent;
        }

        if (partId) {
          try {
            const partData = await fetchPartData(partId);
            if (config.onPartClick) {
              config.onPartClick(partId, partData);
            }
            resolve({ partId, partData, object: clickedObject });
            return;
          } catch (error) {
            resolve(null);
            return;
          }
        }
      }

      resolve(null);
    });
  }, [config, defaultMapObjectToPartId, fetchPartData]);

  return {
    setupClickDetection,
    detectClickAt,
    fetchPartData,
  };
}

