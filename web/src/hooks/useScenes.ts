import { useState, useEffect, useCallback } from "react";
import type { SceneCard } from "../types/scene";

const STORAGE_KEY = "scene-cards";

export function useScenes() {
  const [scenes, setScenes] = useState<SceneCard[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  // 初始化：从localStorage加载
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const loaded = JSON.parse(stored) as SceneCard[];
        // 按order排序
        loaded.sort((a, b) => a.order - b.order);
        setScenes(loaded);
      } catch (error) {
        console.error("Failed to load scenes:", error);
      }
    }
  }, []);

  // 保存到localStorage
  const saveScenes = useCallback((newScenes: SceneCard[]) => {
    setScenes(newScenes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newScenes));
  }, []);

  // 添加场景
  const addScene = useCallback(
    (scene: Omit<SceneCard, "id" | "createdAt" | "updatedAt" | "order">) => {
      const maxOrder = scenes.length > 0 ? Math.max(...scenes.map((s) => s.order)) : 0;
      const newScene: SceneCard = {
        ...scene,
        id: `scene-${Date.now()}`,
        order: maxOrder + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      saveScenes([...scenes, newScene]);
      return newScene.id;
    },
    [scenes, saveScenes]
  );

  // 更新场景
  const updateScene = useCallback(
    (id: string, updates: Partial<SceneCard>) => {
      const newScenes = scenes.map((scene) =>
        scene.id === id
          ? { ...scene, ...updates, updatedAt: Date.now() }
          : scene
      );
      saveScenes(newScenes);
    },
    [scenes, saveScenes]
  );

  // 删除场景
  const deleteScene = useCallback(
    (id: string) => {
      const newScenes = scenes.filter((scene) => scene.id !== id);
      saveScenes(newScenes);
      if (selectedSceneId === id) {
        setSelectedSceneId(null);
      }
    },
    [scenes, selectedSceneId, saveScenes]
  );

  // 根据ID获取场景
  const getScene = useCallback(
    (id: string) => {
      return scenes.find((scene) => scene.id === id);
    },
    [scenes]
  );

  // 更新场景顺序
  const reorderScenes = useCallback(
    (sceneIds: string[]) => {
      const newScenes = sceneIds.map((id, index) => {
        const scene = scenes.find((s) => s.id === id);
        if (!scene) return null;
        return { ...scene, order: index };
      }).filter((s): s is SceneCard => s !== null);

      saveScenes(newScenes);
    },
    [scenes, saveScenes]
  );

  // 移动场景（上移/下移）
  const moveScene = useCallback(
    (id: string, direction: "up" | "down") => {
      const index = scenes.findIndex((s) => s.id === id);
      if (index === -1) return;

      if (direction === "up" && index === 0) return;
      if (direction === "down" && index === scenes.length - 1) return;

      const newScenes = [...scenes];
      const targetIndex = direction === "up" ? index - 1 : index + 1;

      // 交换order
      const temp = newScenes[index].order;
      newScenes[index] = { ...newScenes[index], order: newScenes[targetIndex].order };
      newScenes[targetIndex] = { ...newScenes[targetIndex], order: temp };

      // 重新排序
      newScenes.sort((a, b) => a.order - b.order);
      saveScenes(newScenes);
    },
    [scenes, saveScenes]
  );

  // 按状态筛选
  const getScenesByStatus = useCallback(
    (status: SceneCard["status"]) => {
      return scenes.filter((scene) => scene.status === status);
    },
    [scenes]
  );

  // 按类型筛选
  const getScenesByType = useCallback(
    (type: SceneCard["type"]) => {
      return scenes.filter((scene) => scene.type === type);
    },
    [scenes]
  );

  // 按角色筛选
  const getScenesByCharacter = useCallback(
    (characterId: string) => {
      return scenes.filter((scene) => scene.characters.includes(characterId));
    },
    [scenes]
  );

  // 按剧情线筛选
  const getScenesByPlotline = useCallback(
    (plotlineId: string) => {
      return scenes.filter((scene) => scene.plotlines.includes(plotlineId));
    },
    [scenes]
  );

  // 搜索场景
  const searchScenes = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return scenes.filter(
        (scene) =>
          scene.title.toLowerCase().includes(lowerQuery) ||
          scene.summary.toLowerCase().includes(lowerQuery) ||
          scene.content.toLowerCase().includes(lowerQuery) ||
          scene.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
      );
    },
    [scenes]
  );

  // 计算总字数
  const getTotalWordCount = useCallback(() => {
    return scenes.reduce((total, scene) => total + scene.wordCount, 0);
  }, [scenes]);

  // 计算完成度
  const getCompletionRate = useCallback(() => {
    if (scenes.length === 0) return 0;
    const completed = scenes.filter((s) => s.status === "completed").length;
    return Math.round((completed / scenes.length) * 100);
  }, [scenes]);

  // 导出场景数据
  const exportScenes = useCallback(() => {
    const data = JSON.stringify(scenes, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scenes-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [scenes]);

  // 导入场景数据
  const importScenes = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string) as SceneCard[];
          // 更新ID和order避免冲突
          const maxOrder = scenes.length > 0 ? Math.max(...scenes.map((s) => s.order)) : 0;
          const newScenes = imported.map((scene, index) => ({
            ...scene,
            id: `scene-${Date.now()}-${index}`,
            order: maxOrder + index + 1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }));
          saveScenes([...scenes, ...newScenes]);
        } catch (error) {
          console.error("Failed to import scenes:", error);
          alert("导入失败，请检查文件格式");
        }
      };
      reader.readAsText(file);
    },
    [scenes, saveScenes]
  );

  return {
    scenes,
    selectedSceneId,
    setSelectedSceneId,
    addScene,
    updateScene,
    deleteScene,
    getScene,
    reorderScenes,
    moveScene,
    getScenesByStatus,
    getScenesByType,
    getScenesByCharacter,
    getScenesByPlotline,
    searchScenes,
    getTotalWordCount,
    getCompletionRate,
    exportScenes,
    importScenes,
  };
}
