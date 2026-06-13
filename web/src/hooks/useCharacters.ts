import { useState, useEffect, useCallback } from "react";
import type { CharacterCard } from "../types/character";

const STORAGE_KEY = "character-cards";

export function useCharacters() {
  const [characters, setCharacters] = useState<CharacterCard[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

  // 初始化：从localStorage加载
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCharacters(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to load characters:", error);
      }
    }
  }, []);

  // 保存到localStorage
  const saveCharacters = useCallback((newCharacters: CharacterCard[]) => {
    setCharacters(newCharacters);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCharacters));
  }, []);

  // 添加角色
  const addCharacter = useCallback(
    (character: Omit<CharacterCard, "id" | "createdAt" | "updatedAt">) => {
      const newCharacter: CharacterCard = {
        ...character,
        id: `char-${Date.now()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      saveCharacters([...characters, newCharacter]);
      return newCharacter.id;
    },
    [characters, saveCharacters]
  );

  // 更新角色
  const updateCharacter = useCallback(
    (id: string, updates: Partial<CharacterCard>) => {
      const newCharacters = characters.map((char) =>
        char.id === id
          ? { ...char, ...updates, updatedAt: Date.now() }
          : char
      );
      saveCharacters(newCharacters);
    },
    [characters, saveCharacters]
  );

  // 删除角色
  const deleteCharacter = useCallback(
    (id: string) => {
      saveCharacters(characters.filter((char) => char.id !== id));
      if (selectedCharacterId === id) {
        setSelectedCharacterId(null);
      }
    },
    [characters, selectedCharacterId, saveCharacters]
  );

  // 根据ID获取角色
  const getCharacter = useCallback(
    (id: string) => {
      return characters.find((char) => char.id === id);
    },
    [characters]
  );

  // 获取角色的关系
  const getCharacterRelationships = useCallback(
    (id: string) => {
      const character = getCharacter(id);
      if (!character) return [];

      return character.relationships.map((rel) => {
        const target = getCharacter(rel.targetId);
        return {
          ...rel,
          targetName: target?.name || "未知角色",
          targetRole: target?.role,
        };
      });
    },
    [getCharacter]
  );

  // 添加关系
  const addRelationship = useCallback(
    (fromId: string, toId: string, type: string, description: string, strength: number = 5) => {
      const character = getCharacter(fromId);
      if (!character) return;

      const newRelationship = {
        targetId: toId,
        type,
        description,
        strength,
      };

      updateCharacter(fromId, {
        relationships: [...character.relationships, newRelationship],
      });
    },
    [getCharacter, updateCharacter]
  );

  // 删除关系
  const removeRelationship = useCallback(
    (fromId: string, toId: string) => {
      const character = getCharacter(fromId);
      if (!character) return;

      updateCharacter(fromId, {
        relationships: character.relationships.filter((rel) => rel.targetId !== toId),
      });
    },
    [getCharacter, updateCharacter]
  );

  // 按角色类型筛选
  const getCharactersByRole = useCallback(
    (role: CharacterCard["role"]) => {
      return characters.filter((char) => char.role === role);
    },
    [characters]
  );

  // 按标签筛选
  const getCharactersByTag = useCallback(
    (tag: string) => {
      return characters.filter((char) => char.tags.includes(tag));
    },
    [characters]
  );

  // 搜索角色
  const searchCharacters = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return characters.filter(
        (char) =>
          char.name.toLowerCase().includes(lowerQuery) ||
          char.background.toLowerCase().includes(lowerQuery) ||
          char.traits.some((trait) => trait.toLowerCase().includes(lowerQuery))
      );
    },
    [characters]
  );

  // 导出角色数据
  const exportCharacters = useCallback(() => {
    const data = JSON.stringify(characters, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `characters-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [characters]);

  // 导入角色数据
  const importCharacters = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string) as CharacterCard[];
          // 更新ID避免冲突
          const newCharacters = imported.map((char) => ({
            ...char,
            id: `char-${Date.now()}-${Math.random()}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }));
          saveCharacters([...characters, ...newCharacters]);
        } catch (error) {
          console.error("Failed to import characters:", error);
          alert("导入失败，请检查文件格式");
        }
      };
      reader.readAsText(file);
    },
    [characters, saveCharacters]
  );

  return {
    characters,
    selectedCharacterId,
    setSelectedCharacterId,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    getCharacter,
    getCharacterRelationships,
    addRelationship,
    removeRelationship,
    getCharactersByRole,
    getCharactersByTag,
    searchCharacters,
    exportCharacters,
    importCharacters,
  };
}
