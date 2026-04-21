import { createClient } from "@supabase/supabase-js";
import { PlayerMetrics, PlayerReport } from "./report";

export type PlayerRecord = {
  id: string;
  name: string;
  age: number;
  position: "FW" | "MF" | "DF";
  team: string;
  note: string | null;
  metrics?: PlayerMetrics;
  report?: PlayerReport;
  created_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const localStorageKey = "scoutlink_players";

export const isSupabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseEnabled
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

type CreatePlayerInput = {
  id?: string;
  name: string;
  age: number;
  position: "FW" | "MF" | "DF";
  team: string;
  note: string | null;
  metrics?: PlayerMetrics;
  report?: PlayerReport;
};

const remeasurePrefix = "base_player_id:";

const extractBasePlayerId = (record: Pick<PlayerRecord, "id" | "note">): string => {
  if (!record.note) return record.id;
  const matched = record.note.match(/base_player_id:([^\s]+)/);
  return matched?.[1] ?? record.id;
};

const readLocalPlayers = (): PlayerRecord[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(localStorageKey);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as PlayerRecord[];
  } catch {
    return [];
  }
};

const writeLocalPlayers = (players: PlayerRecord[]) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(localStorageKey, JSON.stringify(players));
};

export const createPlayer = async (input: CreatePlayerInput) => {
  if (supabase) {
    const { error } = await supabase.from("players").insert(input);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const next: PlayerRecord = {
    id: input.id ?? crypto.randomUUID(),
    name: input.name,
    age: input.age,
    position: input.position,
    team: input.team,
    note: input.note,
    metrics: input.metrics,
    report: input.report,
    created_at: new Date().toISOString(),
  };

  const players = readLocalPlayers();
  writeLocalPlayers([next, ...players]);
};

export const listPlayers = async (): Promise<PlayerRecord[]> => {
  if (supabase) {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as PlayerRecord[];
  }

  return readLocalPlayers().sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

export const getPlayerById = async (id: string): Promise<PlayerRecord | null> => {
  if (supabase) {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return null;
    }
    return data as PlayerRecord;
  }

  const players = readLocalPlayers();
  return players.find((player) => player.id === id) ?? null;
};

export const listPlayerHistoryById = async (id: string): Promise<PlayerRecord[]> => {
  const target = await getPlayerById(id);
  if (!target) return [];
  const baseId = extractBasePlayerId(target);

  if (supabase) {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .or(`id.eq.${baseId},note.ilike.%${remeasurePrefix}${baseId}%`)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as PlayerRecord[];
  }

  return readLocalPlayers()
    .filter((player) => extractBasePlayerId(player) === baseId)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
};
