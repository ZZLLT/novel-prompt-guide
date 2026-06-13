import { useState, useEffect, useCallback } from "react";
import type { Plotline } from "../types/plotline";

const STORAGE_KEY = "plotlines";

export function usePlotlines() {
  const [plotlines, setPlotlines] = useState<Plotline[]>([]);
  const [selectedPlotlineId, setSelectedPlotlineId] = useState<string | null>(null);

  // 初始化：从localStorage加载
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPlotlines(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to load plotlines:", error);
      }
    }
  }, []);

  // 保存到localStorage
  const savePlotlines = useCallback((newPlotlines: Plotline[]) => {
    setPlotlines(newPlotlines);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlotlines));
  }, []);

  // 添加剧情线
  const addPlotline = useCallback(
    (plotline: Omit<Plotline, "id" | "createdAt" | "updatedAt">) => {
      const newPlotline: Plotline = {
        ...plotline,
        id: `plotline-${Date.now()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      savePlotlines([...plotlines, newPlotline]);
      return newPlotline.id;
    },
    [plotlines, savePlotlines]
  );

  // 更新剧情线
  const updatePlotline = useCallback(
    (id: string, updates: Partial<Plotline>) => {
      const newPlotlines = plotlines.map((plotline) =>
        plotline.id === id
          ? { ...plotline, ...updates, updatedAt: Date.now() }
          : plotline
      );
      savePlotlines(newPlotlines);
    },
    [plotlines, savePlotlines]
  );

  // 删除剧情线
  const deletePlotline = useCallback(
    (id: string) => {
      savePlotlines(plotlines.filter((plotline) => plotline.id !== id));
      if (selectedPlotlineId === id) {
        setSelectedPlotlineId(null);
      }
    },
    [plotlines, selectedPlotlineId, savePlotlines]
  );

  // 根据ID获取剧情线
  const getPlotline = useCallback(
    (id: string) => {
      return plotlines.find((plotline) => plotline.id === id);
    },
    [plotlines]
  );

  // 添加场景到剧情线
  const addSceneToPlotline = useCallback(
    (plotlineId: string, sceneId: string, note: string = "") => {
      const plotline = getPlotline(plotlineId);
      if (!plotline) return;

      const maxOrder = plotline.scenes.length > 0
        ? Math.max(...plotline.scenes.map((s) => s.order))
        : 0;

      updatePlotline(plotlineId, {
        scenes: [
          ...plotline.scenes,
          { sceneId, order: maxOrder + 1, note }
        ]
      });
    },
    [getPlotline, updatePlotline]
  );

  // 从剧情线移除场景
  const removeSceneFromPlotline = useCallback(
    (plotlineId: string, sceneId: string) => {
      const plotline = getPlotline(plotlineId);
      if (!plotline) return;

      updatePlotline(plotlineId, {
        scenes: plotline.scenes.filter((s) => s.sceneId !== sceneId)
      });
    },
    [getPlotline, updatePlotline]
  );

  // 添加关键节点
  const addKeyPoint = useCallback(
    (plotlineId: string, title: string, description: string, sceneId?: string) => {
      const plotline = getPlotline(plotlineId);
      if (!plotline) return;

      const newKeyPoint = {
        id: `keypoint-${Date.now()}`,
        title,
        description,
        sceneId,
        completed: false
      };

      updatePlotline(plotlineId, {
        keyPoints: [...plotline.keyPoints, newKeyPoint]
      });
    },
    [getPlotline, updatePlotline]
  );

  // 切换关键节点完成状态
  const toggleKeyPoint = useCallback(
    (plotlineId: string, keyPointId: string) => {
      const plotline = getPlotline(plotlineId);
      if (!plotline) return;

      const newKeyPoints = plotline.keyPoints.map((kp) =>
        kp.id === keyPointId ? { ...kp, completed: !kp.completed } : kp
      );

      // 根据完成的关键节点更新进度
      const completedCount = newKeyPoints.filter((kp) => kp.completed).length;
      const progress = newKeyPoints.length > 0
        ? Math.round((completedCount / newKeyPoints.length) * 100)
        : 0;

      updatePlotline(plotlineId, {
        keyPoints: newKeyPoints,
        progress
      });
    },
    [getPlotline, updatePlotline]
  );

  // 删除关键节点
  const deleteKeyPoint = useCallback(
    (plotlineId: string, keyPointId: string) => {
      const plotline = getPlotline(plotlineId);
      if (!plotline) return;

      updatePlotline(plotlineId, {
        keyPoints: plotline.keyPoints.filter((kp) => kp.id !== keyPointId)
      });
    },
    [getPlotline, updatePlotline]
  );

  // 按类型筛选
  const getPlotlinesByType = useCallback(
    (type: Plotline["type"]) => {
      return plotlines.filter((plotline) => plotline.type === type);
    },
    [plotlines]
  );

  // 按状态筛选
  const getPlotlinesByStatus = useCallback(
    (status: Plotline["status"]) => {
      return plotlines.filter((plotline) => plotline.status === status);
    },
    [plotlines]
  );

  // 按角色筛选
  const getPlotlinesByCharacter = useCallback(
    (characterId: string) => {
      return plotlines.filter((plotline) =>
        plotline.characters.includes(characterId)
      );
    },
    [plotlines]
  );

  // 按场景筛选
  const getPlotlinesByScene = useCallback(
    (sceneId: string) => {
      return plotlines.filter((plotline) =>
        plotline.scenes.some((s) => s.sceneId === sceneId)
      );
    },
    [plotlines]
  );

  // 搜索剧情线
  const searchPlotlines = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return plotlines.filter(
        (plotline) =>
          plotline.title.toLowerCase().includes(lowerQuery) ||
          plotline.description.toLowerCase().includes(lowerQuery) ||
          plotline.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
      );
    },
    [plotlines]
  );

  // 计算总体进度
  const getOverallProgress = useCallback(() => {
    if (plotlines.length === 0) return 0;
    const totalProgress = plotlines.reduce((sum, p) => sum + p.progress, 0);
    return Math.round(totalProgress / plotlines.length);
  }, [plotlines]);

  // 导出剧情线数据
  const exportPlotlines = useCallback(() => {
    const data = JSON.stringify(plotlines, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plotlines-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [plotlines]);

  // 导入剧情线数据
  const importPlotlines = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string) as Plotline[];
          // 更新ID避免冲突
          const newPlotlines = imported.map((plotline) => ({
            ...plotline,
            id: `plotline-${Date.now()}-${Math.random()}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }));
          savePlotlines([...plotlines, ...newPlotlines]);
        } catch (error) {
          console.error("Failed to import plotlines:", error);
          alert("导入失败，请检查文件格式");
        }
      };
      reader.readAsText(file);
    },
    [plotlines, savePlotlines]
  );

  return {
    plotlines,
    selectedPlotlineId,
    setSelectedPlotlineId,
    addPlotline,
    updatePlotline,
    deletePlotline,
    getPlotline,
    addSceneToPlotline,
    removeSceneFromPlotline,
    addKeyPoint,
    toggleKeyPoint,
    deleteKeyPoint,
    getPlotlinesByType,
    getPlotlinesByStatus,
    getPlotlinesByCharacter,
    getPlotlinesByScene,
    searchPlotlines,
    getOverallProgress,
    exportPlotlines,
    importPlotlines,
  };
}
