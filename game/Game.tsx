"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { GameUI } from "./GameUI";
import { assetUrl } from "./assets";
import { GraduationPhotos } from "./GraduationPhotos";
import { personalConversation } from "./conversations";
import { NamesPanel } from "./NamesPanel";
import { WorldMap } from "./WorldMap";
import { StoryPhone } from "./StoryPhone";
import { PhoneHub, eventDateText } from "./PhoneHub";
import { DialogueBox } from "./DialogueBox";
import { dialogueEmotion, type Emotion } from "./dialogue";
import { SequenceCast, StoryEffects, castPoint, directionBetween, type StoryEffect } from "./StorySequence";
import { advanceFollower, routineEntities } from "./routines";
import { TimelineJournal } from "./TimelineJournal";
import { EncounterElias, PhoneArt, RadegastPasture } from "./StoryWorldArt";
import { readProgress } from "./memories/progress";
import { TIMELINE_KEY, STORY_END, STORY_EVENTS, STORY_CHAPTERS, storySeason, advanceTimelineClock, beginEvent, completeEvent, emptyEvent, eventById, eventStatus, historicalDate, initialTimeline, jumpToNext, nextEvent, parseTimeline, sleepTimelineClock, type EventProgress, type StoryEvent, type StorySession, type TimelineSave } from "./timeline";
import { NAMES_KEY, displayName, initialNames, parseNames, renamePerson, type NameSave } from "./names";
import { WALK_ATLASES } from "./graphics07";
import { pressedKeys, useInput } from "./input";
import { useMemories } from "./memories/store";
import { MemoryTransition } from "./memories/MemoryTransition";
import { ShootingMemory } from "./memories/ShootingMemory";
import { ItemArt } from "./SceneArt";
import { BenchArt, CharacterArt, WorldAtmosphere, WorldBackdrop, characterStyle } from "./WorldArt";
import { advanceRest, beginRest, hasLeft, leaveRest, restPosition, type RestMotion } from "./rest";
import { movementStep, walkingFrame } from "./motion";
import { advanceActor, availableSeat, canChangePose, initialActors, requestPose, standingActor, type Actor, type Actors, type Pose } from "./actors";
import { speakerGraphic } from "./graphics";
import { cameraFor, offscreenGuide } from "./camera";
import { audioAllowed, worldAudio } from "./audio";
import { ACTION_MINUTES, DAY_KEY, REST_SPOTS, SCHOOL_END, SCHOOL_START, TRAVEL_MINUTES, activityAt, clockText, parseDay, seasonalLight, type DaySave, type RestSpot } from "./day";
import { CHAPTERS, ENTITIES, PLACES, SPAWNS, STORY_KEY, EMPTY_STORY, advanceStory, beginChapter, canWalk, storyCanWalk, currentStep, parseStory, routeTo, type ChapterId, type Entity, type Place, type Point, type StorySave } from "./story";

type Direction = "front" | "left" | "back" | "right";
type Dialogue = { speaker: string; art?: string; text: string; target?: string; ending?: boolean; choices?: string[]; emotion?: Emotion; action?: "school" | "pose" | "kitchen" | "encounter" | "calendar" | "sequence"; response?: boolean; actorId?: string; kitchenId?: string; morning?: boolean };
type Rest = { spot: RestSpot; elias: boolean; motion: RestMotion; companion?: RestMotion };
type Notice = { date: string; minute: number; label: string };
function clearMovement() { pressedKeys.clear(); useInput.getState().setMove(0, 0); }
function inhabitants(place: Place, visiting: Place | null) { return visiting === place && !ENTITIES[place].some(entity=>entity.art === "elias") ? [...ENTITIES[place],ELIAS_GUEST] : ENTITIES[place]; }

export function Game() {
  const [started, setStarted] = useState(false);
  const [initial] = useState(() => {
    try { return { save: parseStory(window.localStorage.getItem(STORY_KEY)), error: null }; }
    catch { return { save: EMPTY_STORY, error: "Der gespeicherte Spielstand ist nicht lesbar. Er bleibt unangetastet; du kannst für diese Sitzung spielen." }; }
  });
  const [worldSave, setStory] = useState<StorySave>(initial.save);
  const [timelineInitial] = useState(() => {
    try {
      const raw = window.localStorage.getItem(TIMELINE_KEY);
      if (raw) return { save: parseTimeline(raw), error: null };
      let legacyDay: DaySave | undefined;
      try { const rawDay = window.localStorage.getItem(DAY_KEY); if (rawDay) legacyDay = parseDay(rawDay); } catch { /* Preserve unreadable legacy data. */ }
      let shootingCompleted = false;
      try { shootingCompleted = Boolean(readProgress(window.localStorage)["goelzau-shooting"]); } catch { /* The existing store reports its own error. */ }
      return { save: initialTimeline(legacyDay, initial.save, shootingCompleted), error: null };
    } catch { return { save: initialTimeline(undefined, initial.save), error: "Der Story-Kalender ist nicht lesbar und bleibt unangetastet. Du kannst für diese Sitzung spielen." }; }
  });
  const [timeline, setTimeline] = useState<TimelineSave>(timelineInitial.save);
  const timelineRef = useRef(timelineInitial.save);
  const timelineReadable = useRef(!timelineInitial.error);
  const [dayError, setDayError] = useState<string | null>(timelineInitial.error);
  const day = timeline.clock;
  const dayRef = useRef(day);
  const [replay, setReplay] = useState<{ session: StorySession; state: EventProgress } | null>(null);
  const replayRef = useRef(replay);
  const [legacyView, setLegacyView] = useState<{ save: StorySave; player: Point; direction: Direction } | null>(null);
  const session = replay?.session ?? timeline.active;
  const event = session ? eventById(session.id) : undefined;
  const eventState = replay?.state ?? (session ? timeline.progress[session.id] ?? emptyEvent() : null);
  const sequenceBeat = event?.steps?.[eventState?.cursor ?? 0];
  const save: StorySave = event ? { ...worldSave, place: sequenceBeat?.place ?? event.place, chapter: null, bag: event.scene === "encounter" && (eventState?.cursor ?? 0) >= 3 ? ["Schokolade"] : [] } : worldSave;
  const [phone, setPhone] = useState(false);
  const [cinema, setCinemaState] = useState<StoryEffect | null>(null);
  const cinemaRef = useRef<StoryEffect | null>(null);
  function setCinema(value:StoryEffect | null) { cinemaRef.current=value;setCinemaState(value); }
  const cinemaOrigin = useRef<Point | null>(null);
  const [finale, setFinale] = useState(false);
  const finaleElapsed = useRef(0);
  const [followingElias, setFollowingElias] = useState(false);
  const [storyToast, setStoryToast] = useState<StoryEvent | null>(null);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  replayRef.current = replay;
  const arrival = useRef(0);
  const [arrivalTime, setArrivalTime] = useState(0);
  const [namesInitial] = useState(() => {
    try { return { save: parseNames(window.localStorage.getItem(NAMES_KEY)), error: null }; }
    catch { return { save: initialNames(), error: "Die gespeicherten Namen sind nicht lesbar und bleiben unangetastet. Neue Namen gelten für diese Sitzung." }; }
  });
  const [names, setNames] = useState<NameSave>(namesInitial.save);
  const namesRef = useRef(namesInitial.save);
  const namesReadable = useRef(!namesInitial.error);
  const [namesError, setNamesError] = useState<string | null>(namesInitial.error);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [rest, setRest] = useState<Rest | null>(null);
  const restRef = useRef<Rest | null>(null);
  const [visitingElias, setVisitingElias] = useState<Place | null>(null);
  const [actors, setActors] = useState<Actors>(initialActors);
  const actorsRef = useRef(actors);
  const [photoMoment, setPhotoMoment] = useState<{ target?: string } | null>(null);
  const [kitchenEffect, setKitchenEffect] = useState<string | null>(null);
  const [player, setPlayer] = useState<Point>(timelineInitial.save.active ? (eventById(timelineInitial.save.active.id)!.steps?.[timelineInitial.save.progress[timelineInitial.save.active.id]?.cursor ?? 0]?.place ? SPAWNS[eventById(timelineInitial.save.active.id)!.steps![timelineInitial.save.progress[timelineInitial.save.active.id]?.cursor ?? 0].place!] : eventById(timelineInitial.save.active.id)!.staging.spawn) : SPAWNS[initial.save.place]);
  const [direction, setDirection] = useState<Direction>("front");
  const [walking, setWalking] = useState(false);
  const [walkFrame, setWalkFrame] = useState(0);
  const walkDistance = useRef(0);
  const [dog, setDog] = useState<Point>({ x: .58, y: .53 });
  const dogRef = useRef(dog);
  const [journal, setJournal] = useState(false);
  const [dialogue, setDialogue] = useState<Dialogue | null>(null);
  const [needsLandscape, setNeedsLandscape] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(initial.error);
  const readable = useRef(!initial.error);
  const playerRef = useRef(player);
    const journalRef = useRef<HTMLDialogElement>(null);
  const paused = useInput(s => s.paused);
  const phase = useMemories(s => s.phase);
  const memoryProgress = useMemories(s => s.progress);
  const memoryError = useMemories(s => s.storageError);
  const transitioning = phase === "entering" || phase === "leaving";
  const inWorld = phase === "room";
  const active = started && !paused && !needsLandscape && inWorld && !journal && !dialogue && !phone && !photoMoment && !cinema && !finale;
  const chapter = CHAPTERS.find(c => c.id === save.chapter);
  const step = currentStep(save);
  const draftPlaying = Boolean(legacyView || worldSave.chapter && currentStep(worldSave));
  const exits = event ? [] : PLACES[save.place].exits;
  const guide = step && step.place !== save.place ? routeTo(save.place, step.place) : undefined;
  const dogFollows = save.place === "garden" && save.completed.includes("dog") && save.chapter !== "dog";
  const sourceEntities = (event ? [] : routineEntities(save.place, save.chapter ? 840 : day.minute, inhabitants(save.place,visitingElias),followingElias)).map(entity => ({ ...entity, name: displayName(entity, names) }));
  const sceneEntities = sourceEntities.filter(e => !rest?.elias || e.art !== "elias").map(e => cinema && !cinema.sequence && e.art === "elias" ? {...e,...castPoint(undefined,player,cinema,save.place)} : e.id === "anuk" && dogFollows ? { ...e, ...dog } : actors[e.id] ? { ...e, ...actors[e.id].position } : e);
  const nearbyExit = exits.filter(e => Math.hypot(e.x-player.x, e.y-player.y) < .105).sort((a,b) => Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];
  const nearbyEntity = sceneEntities.map(e => ({ e, d: Math.hypot(e.x - player.x, e.y - player.y), companion: e.id === "anuk" && save.completed.includes("dog") && save.chapter !== "dog" })).filter(v => v.d < .115 && !(v.companion && nearbyExit) && (!nearbyExit || v.d < Math.hypot(nearbyExit.x-player.x, nearbyExit.y-player.y))).sort((a,b) => Number(a.companion)-Number(b.companion) || a.d-b.d)[0]?.e;
  const spots = REST_SPOTS.filter(spot => spot.place === save.place && (!event || event.scene !== "encounter"));
  const nearbySpot = spots.filter(spot => Math.hypot(spot.approach.x-player.x,spot.approach.y-player.y) < .115 && !Object.values(actors).some(actor => actor.restId?.startsWith(`${spot.id}:`))).sort((a,b) => Math.hypot(a.approach.x-player.x,a.approach.y-player.y)-Math.hypot(b.approach.x-player.x,b.approach.y-player.y))[0];
  const restTarget = nearbySpot && (!nearbyEntity || Math.hypot(nearbySpot.approach.x-player.x,nearbySpot.approach.y-player.y) < Math.hypot(nearbyEntity.x-player.x,nearbyEntity.y-player.y)) && (!nearbyExit || Math.hypot(nearbySpot.approach.x-player.x,nearbySpot.approach.y-player.y) < Math.hypot(nearbyExit.x-player.x,nearbyExit.y-player.y)) ? nearbySpot : undefined;
  const sequenceNearby = event?.scene === "sequence" && sequenceBeat && Math.hypot(player.x-sequenceBeat.target.x, player.y-sequenceBeat.target.y) < .13;
  const target = restTarget ?? nearbyEntity ?? nearbyExit;
  const targetName = restTarget?.name ?? nearbyEntity?.name ?? nearbyExit?.label;
  const sceneMinute = event ? event.scene === "chat" ? Math.min(1380, Math.max(event.staging.start, 1020 + (eventState?.topics.length ?? 0) * 120)) : event.scene === "sequence" ? Math.round(event.staging.start+(event.staging.end-event.staging.start)*(eventState?.cursor??0)/Math.max(1,(event.steps?.length??1)-1)) : event.staging.start : save.chapter === "graduation" ? 840 : day.minute;
  const sceneSeason = save.chapter === "graduation" ? "Sommer" : save.chapter === "christmas" ? "Winter" : storySeason(event, day);
  const light = seasonalLight(sceneSeason, sceneMinute);
  const winter = sceneSeason === "Winter";
  const upcoming = nextEvent(timeline);
  const datedCompleted = STORY_EVENTS.filter(e => e.confirmed && timeline.progress[e.id]?.completedAt).length;
  const arrived = eventState && eventState.cursor > 0 ? 1 : Math.min(1, arrivalTime / 3);
  const eliasPoint = { x: .78 - .18 * arrived, y: .91 - .27 * arrived };
  const encounterNearby = event?.scene === "encounter" && (eventState?.cursor ?? 0) >= 1 && Math.hypot(player.x - .6, player.y - .64) < .13;
  const restPose: Pose = cinema && ["sit","kiss"].includes(cinema.kind) ? "sitting" : rest?.motion.actor.pose ?? "standing";
  const bedOccupied = rest?.spot.kind === "bed" && rest.motion.phase === "resting";
  const settled = rest?.motion.phase === "resting";

  function changeRest(next: Rest | null) { restRef.current = next; setRest(next); }

  function updateActors(next: Actors) { actorsRef.current = next; setActors(next); }

  function position(point: Point) { playerRef.current = point; setPlayer(point); setWalking(false); clearMovement(); }
  const setSave = useCallback((next: StorySave) => {
    setStory(next);
    if (!readable.current) return;
    try { window.localStorage.setItem(STORY_KEY, JSON.stringify(next)); setSaveError(null); }
    catch { setSaveError("Speichern ist gerade nicht möglich. Dein Fortschritt bleibt für diese Sitzung erhalten."); }
  }, [setStory, setSaveError]);
  const persistTimeline = useCallback((next: TimelineSave) => {
    timelineRef.current = next; dayRef.current = next.clock; setTimeline(next);
    if (!timelineReadable.current) return;
    try { window.localStorage.setItem(TIMELINE_KEY, JSON.stringify(next)); setDayError(null); }
    catch { setDayError("Der Story-Fortschritt bleibt für diese Sitzung erhalten. Lokales Speichern ist gerade nicht möglich."); }
  }, []);
  const persistDay = useCallback((next: DaySave) => {
    if (sessionRef.current || draftPlaying) return;
    persistTimeline({ ...timelineRef.current, clock: next });
  }, [persistTimeline, draftPlaying]);
  const changeEventState = useCallback((next: EventProgress) => {
    if (replayRef.current) { const value = { ...replayRef.current, state: next }; replayRef.current = value; setReplay(value); return; }
    const current = timelineRef.current;
    if (current.active) persistTimeline({ ...current, progress: { ...current.progress, [current.active.id]: next } });
  }, [persistTimeline]);
  function persistNames(next: NameSave) {
    namesRef.current = next; setNames(next);
    if (!namesReadable.current) return;
    try { window.localStorage.setItem(NAMES_KEY, JSON.stringify(next)); setNamesError(null); }
    catch { setNamesError("Die Namen gelten für diese Sitzung. Sie konnten nicht auf diesem Gerät gespeichert werden."); }
  }
  function changeName(id: string, value: string) {
    try { persistNames(renamePerson(namesRef.current, id, value)); }
    catch { setNamesError("Bitte verwende einen Namen mit höchstens 32 Zeichen."); }
  }
  const spendTime = useCallback((minutes: number, place = save.place) => {
    if (sessionRef.current || legacyView || worldSave.chapter && currentStep(worldSave)) return;
    const result = advanceTimelineClock(dayRef.current, minutes);
    persistDay(result.save);
    setNotices(previous => [...previous, ...result.notices.map(notice => ({ ...notice, label: `${activityAt(place, notice.minute % 1440)} · ${PLACES[place].name}` }))]);
  }, [persistDay, save.place, legacyView, worldSave]);
  useEffect(() => { if (started) persistTimeline(timelineRef.current); }, [started, persistTimeline]);
  useEffect(() => {
    worldAudio.setMood(cinema?.kind === "kiss" || event?.scene === "confession" && (eventState?.cursor ?? 0) >= 1 || event?.scene === "love" && (eventState?.cursor ?? 0) >= 2 ? "love" : event && event.scene !== "encounter" ? "evening" : "world");
  }, [event, eventState?.cursor, cinema?.kind]);
  useEffect(() => {
    if (!notices.length || !active || document.hidden) return;
    const timer = window.setTimeout(() => setNotices(previous => previous.slice(1)), 4500);
    return () => window.clearTimeout(timer);
  }, [notices, active]);
  useEffect(() => {
    if (!kitchenEffect || !active) return;
    const timer = window.setTimeout(() => setKitchenEffect(null), 3000);
    return () => window.clearTimeout(timer);
  }, [kitchenEffect, active]);
  useEffect(() => { useMemories.getState().load(); }, []);
  useEffect(() => {
    try { worldAudio.load(window.localStorage); } catch { /* Storage may be disabled. */ }
    return () => worldAudio.stop();
  }, []);
  useEffect(() => {
    const sync = () => worldAudio.setScene(inWorld ? save.place : "range", audioAllowed({ started, paused, hidden: document.hidden, landscape: !needsLandscape, transitioning }));
    sync(); document.addEventListener("visibilitychange", sync);
    return () => { document.removeEventListener("visibilitychange", sync); worldAudio.stop(); };
  }, [started, paused, needsLandscape, transitioning, save.place, inWorld]);

  useEffect(() => {
    const query = window.matchMedia("(orientation: portrait) and (max-width: 760px)");
    const update = () => { setNeedsLandscape(query.matches); if (query.matches) clearMovement(); };
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const node = journal ? journalRef.current : null;
    if (node && !node.open) node.showModal();
    return () => { if (node?.open) node.close(); };
  }, [journal]);

  const move = useCallback((seconds: number) => {
    const next = { ...actorsRef.current };
    let changed = false;
    for (const entity of event ? [] : routineEntities(save.place, save.chapter ? 840 : dayRef.current.minute, inhabitants(save.place,visitingElias),followingElias)) {
      const actor = next[entity.id];
      if (!actor || restRef.current?.elias && entity.art === "elias") continue;
      const updated = followingElias && entity.art === "elias" ? advanceFollower(save.place,actor,playerRef.current,seconds) : advanceActor(save.place, entity.id, actor, seconds);
      if (updated !== actor) { next[entity.id] = updated; changed = true; }
    }
    if (changed) { actorsRef.current = next; setActors(next); }
    if (event?.scene === "encounter" && eventState?.cursor === 0) {
      arrival.current += seconds; setArrivalTime(arrival.current);
      if (arrival.current >= 3) changeEventState({ ...eventState, cursor: 1 });
    }
    if (dogFollows) {
      const offset = { x: playerRef.current.x-dogRef.current.x, y: playerRef.current.y-dogRef.current.y };
      const distance = Math.hypot(offset.x, offset.y);
      if (distance > .11) {
        const next = movementStep(dogRef.current, { x: offset.x/distance, y: offset.y/distance }, seconds*.8, (x,y) => canWalk("garden",x,y));
        dogRef.current = next; setDog(next);
      }
    }
    const currentRest = restRef.current;
    if (currentRest) {
      const motion = advanceRest(save.place, "felice", currentRest.motion, seconds);
      const companion = currentRest.companion ? advanceRest(save.place, "elias", currentRest.companion, seconds) : undefined;
      const point = restPosition(currentRest.spot, motion);
      playerRef.current = point; setPlayer(point); setWalking(motion.actor.moving); setWalkFrame(motion.actor.frame); setDirection(motion.actor.direction);
      if (hasLeft(motion) && (!companion || hasLeft(companion))) {
        if (companion) {
          const native = ENTITIES[save.place].find(entity => entity.art === "elias");
          const id = native?.id ?? ELIAS_GUEST.id;
          const updated = { ...actorsRef.current, [id]: companion.actor };
          actorsRef.current = updated; setActors(updated);
          if (!native) setVisitingElias(save.place);
        }
        restRef.current = null; setRest(null);
      } else if (motion !== currentRest.motion || companion !== currentRest.companion) {
        const nextRest = { ...currentRest, motion, companion };
        restRef.current = nextRest; setRest(nextRest);
      }
      return;
    }
    const input = useInput.getState();
    let dx = Math.abs(input.moveX) > .05 ? input.moveX : Number(pressedKeys.has("KeyD") || pressedKeys.has("ArrowRight")) - Number(pressedKeys.has("KeyA") || pressedKeys.has("ArrowLeft"));
    let dy = Math.abs(input.moveY) > .05 ? -input.moveY : Number(pressedKeys.has("KeyS") || pressedKeys.has("ArrowDown")) - Number(pressedKeys.has("KeyW") || pressedKeys.has("ArrowUp"));
    const magnitude = Math.hypot(dx,dy);
    if (magnitude <= .02) { setWalking(false); return; }
    if (magnitude > 1) { dx /= magnitude; dy /= magnitude; }
    setDirection(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? "right" : "left" : dy > 0 ? "front" : "back");
    const p = playerRef.current;
    const { x, y } = movementStep(p, { x: dx, y: dy }, seconds, (x, y) => storyCanWalk(save.place, x, y, { pasture: event?.scene === "encounter" }));
    const distance = Math.hypot(x-p.x,y-p.y);
    const moved = distance > .00001;
    setWalking(moved);
    if (moved) {
      const previous = Math.floor(walkDistance.current / .054);
      walkDistance.current += distance;
      setWalkFrame(walkingFrame(walkDistance.current));
      if (Math.floor(walkDistance.current / .054) !== previous) worldAudio.play("step");
      playerRef.current = {x,y}; setPlayer({x,y});
    }
  }, [save.place, dogFollows, visitingElias, event, eventState, changeEventState, followingElias, save.chapter]);

  const interact = useCallback(() => {
    if (!active) return;
    clearMovement();
    worldAudio.play("interact");
    if (event?.scene === "sequence") {
      if (sequenceNearby && sequenceBeat) {
        setDirection(directionBetween(playerRef.current, castPoint(sequenceBeat,playerRef.current,null,save.place)));
        setDialogue({speaker:sequenceBeat.speaker,art:sequenceBeat.art,text:sequenceBeat.text,emotion:dialogueEmotion(sequenceBeat.text,sequenceBeat.emotion as Emotion),choices:sequenceBeat.choices,action:"sequence",target:sequenceBeat.id});
      }
      return;
    }
    if (event?.scene === "encounter") {
      setDirection(directionBetween(playerRef.current, eliasPoint));
      const line = event.dialogue[Math.min(4, eventState?.cursor ?? 0)];
      if (encounterNearby && eventState) setDialogue({ speaker: line.speaker, art: line.speaker === "Elias" ? "elias" : line.speaker === "Felice" ? "felice" : undefined, emotion: dialogueEmotion(line.text, line.emotion as Emotion), text: line.text, action: "encounter", choices: [eventState.cursor >= 4 ? "Diesen Moment bewahren" : "Einen Moment weiter"] });
      return;
    }
    if (rest) {
      if (rest.motion.phase === "leaving") return;
      changeRest({ ...rest, motion: leaveRest(save.place, rest.motion), companion: rest.companion ? leaveRest(save.place, rest.companion) : undefined });
      spendTime(ACTION_MINUTES); return;
    }
    if (restTarget) {
      changeRest({ spot: restTarget, elias: false, motion: beginRest(save.place, playerRef.current, restTarget) }); spendTime(ACTION_MINUTES); return;
    }
    if (nearbyEntity) {
      if (nearbyEntity.id === "graduation-photo" && (step?.target === nearbyEntity.id || save.completed.includes("graduation"))) {
        setPhotoMoment({ target: step?.target === nearbyEntity.id ? nearbyEntity.id : undefined }); return;
      }
      if (nearbyEntity.id === "album") { setJournal(true); return; }
      if (save.place === "kitchen" && nearbyEntity.kind === "item") {
        setDialogue({ speaker: "Felice", text: nearbyEntity.text, action: "kitchen", kitchenId: nearbyEntity.id, choices: [`${nearbyEntity.name} · 10 Min.`, "Zurück ins Spiel"] }); return;
      }
      if (nearbyEntity.id === "school-door" && dayRef.current.minute < SCHOOL_END) {
        setDialogue({ speaker: "Schule", text: `Der Unterricht geht von ${clockText(SCHOOL_START)} bis ${clockText(SCHOOL_END)} Uhr.${dayRef.current.minute < SCHOOL_START ? " Bis zum Beginn wartest du in Ruhe." : " Du gehst in den Unterricht."}`, action: "school", choices: ["Unterricht besuchen", "Noch auf dem Schulhof bleiben"] }); return;
      }
      if (nearbyEntity.id === "photo" || nearbyEntity.id === "shoot") {
        if (nearbyEntity.id === "shoot" && save.chapter === "shooting" && step?.target === "range-host") {
          setDialogue({ speaker: "Felice", text: "Ich begrüße erst kurz die Person am Schießstand." }); return;
        }
        useMemories.getState().enter("goelzau-shooting"); return;
      }
      const matches = step?.place === save.place && step.target === nearbyEntity.id;
      if (!matches && nearbyEntity.kind === "person" && canChangePose(nearbyEntity.art)) {
        const actor = actorsRef.current[nearbyEntity.id];
        setDirection(directionBetween(playerRef.current,nearbyEntity));
        if(actor) updateActors({...actorsRef.current,[nearbyEntity.id]:{...actor,direction:directionBetween(actor.position,playerRef.current),moving:false}});
        const choices = [...(nearbyEntity.art === "elias" ? ["Umarmen", "Hand geben", followingElias ? "Spaziergang beenden" : "Gemeinsam spazieren"] : []), ...(personalConversation(nearbyEntity.id) ? ["Persönlich reden"] : []), ...(spots.some(spot => spot.kind !== "bed") ? ["Hinsetzen"] : []), ...(actor?.pose !== "standing" ? ["Aufstehen"] : []), "Weiterreden"];
        setDialogue({ speaker: nearbyEntity.name, art: nearbyEntity.art, text: `${nearbyEntity.text}\n${actor?.pose === "sitting" ? "Du kannst mich gern wieder zum Aufstehen einladen." : "Ein bisschen Zeit für eine Pause?"}`, actorId: nearbyEntity.id, action: "pose", choices }); return;
      }
      const original = ENTITIES[save.place].find(entity => entity.id === nearbyEntity.id);
      const entitySpeaks = !matches || step.speaker === original?.name;
      setDialogue({ speaker: entitySpeaks ? nearbyEntity.name : step.speaker, art: entitySpeaks && nearbyEntity.kind !== "item" ? nearbyEntity.art : undefined, text: matches ? step.text : nearbyEntity.text, target: matches ? nearbyEntity.id : undefined, choices: matches && nearbyEntity.id === "elias-bus" ? ["Zusammen losgehen", "Ich freue mich auf den Tag mit dir"] : undefined });
    } else if (nearbyExit) {
      if(followingElias) {
        const native=ENTITIES[nearbyExit.to].find(entity=>entity.art === "elias");
        const id=native?.id ?? ELIAS_GUEST.id;
        const spawn=[{x:nearbyExit.spawn.x+.075,y:nearbyExit.spawn.y},{x:nearbyExit.spawn.x-.075,y:nearbyExit.spawn.y},nearbyExit.spawn].find(point=>canWalk(nearbyExit.to,point.x,point.y)) ?? nearbyExit.spawn;
        updateActors({...actorsRef.current,[id]:standingActor(spawn)});
        setVisitingElias(nearbyExit.to);
      }
      setSave({ ...save, place: nearbyExit.to }); position(nearbyExit.spawn); spendTime(TRAVEL_MINUTES, nearbyExit.to);
    }
  }, [active, nearbyEntity, nearbyExit, rest, restTarget, step, save, setSave, spendTime, event, eventState, encounterNearby, sequenceBeat, sequenceNearby, followingElias, eliasPoint]);

  function finishDialogue(choice?: string) {
    if (!dialogue) return;
    if (dialogue.action === "calendar") { setDialogue(null); return; }
    if (dialogue.action === "sequence" && sequenceBeat) {
      if (dialogue.choices?.length && choice && !dialogue.response) {
        setDialogue({ speaker: "Felice", art: "felice", text: choice+".", emotion: "happy", action: "sequence", response: true }); return;
      }
      setDialogue(null); clearMovement();
      if(sequenceBeat.animation) {
        cinemaOrigin.current=playerRef.current;
        if(["sit","kiss"].includes(sequenceBeat.animation)) { const seat = REST_SPOTS.find(spot=>spot.place===save.place && Math.hypot(spot.approach.x-sequenceBeat.target.x,spot.approach.y-sequenceBeat.target.y)<.14); if(seat) position(seat.position); }
        setCinema({id:sequenceBeat.id,kind:sequenceBeat.animation,elapsed:0,sequence:true});
      }
      else advanceSequence();
      return;
    }
    if (dialogue.action === "encounter" && eventState) {
      setDialogue(null);
      if (eventState.cursor >= 4) finishCurrentEvent();
      else changeEventState({ ...eventState, cursor: eventState.cursor + 1 });
      return;
    }
    if (dialogue.action === "school") {
      if (choice === "Unterricht besuchen") spendTime(SCHOOL_END - dayRef.current.minute, "school");
      setDialogue(null); clearMovement(); return;
    }
    if (dialogue.action === "kitchen") {
      if (choice !== "Zurück ins Spiel") { spendTime(ACTION_MINUTES); setKitchenEffect(dialogue.kitchenId ?? null); }
      setDialogue(null); clearMovement(); return;
    }
    if (dialogue.action === "pose" && dialogue.actorId && choice === "Persönlich reden") {
      setDialogue({ speaker: dialogue.speaker, art: dialogue.art, text: personalConversation(dialogue.actorId) ?? "Schön, mit dir zu reden." });
      spendTime(ACTION_MINUTES); clearMovement(); return;
    }
    if (dialogue.action === "pose" && dialogue.actorId && ["Umarmen","Hand geben","Gemeinsam spazieren","Spaziergang beenden"].includes(choice ?? "")) {
      if (choice === "Gemeinsam spazieren" || choice === "Spaziergang beenden") {
        const actor=actorsRef.current[dialogue.actorId];
        if(actor) updateActors({...actorsRef.current,[dialogue.actorId]:standingActor(canWalk(save.place,actor.position.x,actor.position.y) ? actor.position : actor.approach ?? playerRef.current)});
        setFollowingElias(choice === "Gemeinsam spazieren");
      }
      else setCinema({id:dialogue.actorId,kind:choice === "Umarmen" ? "hug" : "handhold",elapsed:0,sequence:false});
      spendTime(ACTION_MINUTES); setDialogue(null); clearMovement(); return;
    }
    if (dialogue.action === "pose" && dialogue.actorId) {
      if (choice !== "Weiterreden") {
        const pose: Pose = choice === "Aufstehen" ? "standing" : "sitting";
        const actor = actorsRef.current[dialogue.actorId];
        const seat = pose === "standing" ? undefined : availableSeat(save.place, pose, actor.position, actorsRef.current, rest?.spot.id);
        if (pose !== "standing" && !seat) { setDialogue({ speaker: dialogue.speaker, art: dialogue.art, text: "Die Ruheplätze sind gerade belegt. Lass uns später noch einmal schauen." }); return; }
        updateActors({ ...actorsRef.current, [dialogue.actorId]: requestPose(save.place, actor, pose, seat) });
      }
      spendTime(ACTION_MINUTES); setDialogue(null); clearMovement(); return;
    }
    if (!dialogue.ending && !dialogue.morning) spendTime(ACTION_MINUTES);
    if (dialogue.target) {
      const next = advanceStory(save, dialogue.target);
      setSave(next);
      if (!currentStep(next) && chapter) {
        registerLegacyCompletion(chapter.id);
        worldAudio.play("complete");
        setDialogue({ speaker: chapter.title, text: chapter.ending, ending: true }); return;
      }
    }
    if (dialogue.ending && legacyView) restoreDraft();
    setDialogue(null); clearMovement();
  }

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest('dialog,input,select,textarea,[contenteditable="true"]')) return;
      if (event.code === "Escape" && started && !transitioning) { event.preventDefault(); useInput.getState().setPaused(!useInput.getState().paused); clearMovement(); return; }
      if (event.code === "KeyJ" && started && inWorld && !paused && !needsLandscape && !phone && !photoMoment && !event.repeat) { event.preventDefault(); clearMovement(); setJournal(v => !v); return; }
      if (!active) return;
      if (["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(event.code)) {
        event.preventDefault(); pressedKeys.add(event.code);
      }
      if (event.code === "KeyE" && !event.repeat) { event.preventDefault(); interact(); }
    };
    const up = (event: KeyboardEvent) => pressedKeys.delete(event.code);
    const blur = () => { clearMovement(); setWalking(false); if (started) useInput.getState().setPaused(true); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, [active, started, inWorld, paused, needsLandscape, transitioning, move, interact, phone, photoMoment]);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      if (!document.hidden) move(Math.min((now-previous)/1000, .1));
      previous = now;
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => { window.cancelAnimationFrame(frame); clearMovement(); };
  }, [active,move]);

  function selectChapter(id: ChapterId) {
    if (session) return;
    setLegacyView(previous => previous ?? { save: worldSave, player: rest?.spot.approach ?? playerRef.current, direction });
    const next = beginChapter(save,id);
    setSave(next); changeRest(null); setPhotoMoment(null); position(SPAWNS[next.place]); setJournal(false);
    const c = CHAPTERS.find(c => c.id === id)!;
    setDialogue({ speaker: "Undatierter Szenenentwurf", text: `Fiktionalisierter vorhandener Ablauf. Historisches Datum und genaue Details werden noch ergänzt.\n\n${c.intro}`, action: "calendar" });
  }

  function restoreDraft() {
    if (!legacyView) return;
    setSave({ ...legacyView.save, completed: [...new Set([...legacyView.save.completed, ...worldSave.completed])] });
    position(legacyView.player); setDirection(legacyView.direction); changeRest(null); setLegacyView(null);
  }

  function registerLegacyCompletion(id: ChapterId) {
    const current = timelineRef.current, prior = current.progress[`legacy-${id}`] ?? emptyEvent();
    persistTimeline({ ...current, progress: { ...current.progress, [`legacy-${id}`]: { ...prior, completedAt: prior.completedAt ?? new Date().toISOString(), visits: prior.visits + 1 } } });
  }

  function selectTimelineEvent(id: string, fromPhone = false) {
    const selected = eventById(id);
    if (!selected) return;
    if (selected.scene === "legacy") { if (selected.confirmed && eventStatus(timelineRef.current, selected) !== "gesperrt" && selected.chapter) selectChapter(selected.chapter); return; }
    if (session?.id === id) { setJournal(false); return; }
    if (session) return;
    const status = eventStatus(timelineRef.current, selected);
    if (status === "gesperrt") return;
    const returnPlayer = legacyView?.player ?? rest?.spot.approach ?? playerRef.current;
    const returnDirection = legacyView?.direction ?? direction;
    if (legacyView) restoreDraft();
    if (status === "abgeschlossen") setReplay({ session: { id, returnPlayer, returnDirection }, state: emptyEvent() });
    else persistTimeline(beginEvent(timelineRef.current, id, returnPlayer, returnDirection));
    arrival.current = 0; setArrivalTime(0); setStoryToast(null); setCinema(null); cinemaOrigin.current=null; setFollowingElias(false);
    setJournal(false); setDialogue(null);
    if (fromPhone && rest && selected.place === "bedroom") { clearMovement(); setPhone(true); }
    else { changeRest(null); setPhone(false); const checkpoint = status === "abgeschlossen" ? 0 : timelineRef.current.progress[id]?.cursor ?? 0; const beatPlace = selected.steps?.[checkpoint]?.place; position(beatPlace && beatPlace !== selected.place ? SPAWNS[beatPlace] : selected.staging.spawn); }
  }

  function leaveStory() {
    if (!session) return;
    if (replay) { replayRef.current = null; setReplay(null); }
    else persistTimeline({ ...timelineRef.current, active: null });
    setCinema(null); setFinale(false); setPhone(false); setDialogue(null); setJournal(false); changeRest(null); position(session.returnPlayer); setDirection(session.returnDirection);
  }

  function advanceSequence() {
    const currentSession = sessionRef.current;
    if(!currentSession) return;
    const currentEvent=eventById(currentSession.id);
    if(!currentEvent) return;
    const state = replayRef.current?.state ?? timelineRef.current.progress[currentEvent.id] ?? emptyEvent();
    const next = { ...state, cursor:state.cursor+1 };
    if(cinemaOrigin.current) { position(cinemaOrigin.current); cinemaOrigin.current=null; }
    changeEventState(next); setCinema(null);
    if(next.cursor >= (currentEvent.steps?.length ?? 1)) { finishCurrentEvent(); return; }
    const oldPlace = currentEvent.steps?.[state.cursor]?.place ?? currentEvent.place;
    const nextPlace = currentEvent.steps?.[next.cursor]?.place ?? currentEvent.place;
    if(nextPlace !== oldPlace) { changeRest(null); position(SPAWNS[nextPlace]); }
  }

  function finishCurrentEvent() {
    const currentSession = sessionRef.current;
    if (!currentSession) return;
    const finished = eventById(currentSession.id);
    if (!finished) return;
    const current = timelineRef.current;
    const replaying = Boolean(replayRef.current);
    const state = replayRef.current?.state ?? current.progress[finished.id] ?? emptyEvent();
    if (finished.scene === "chat" && (state.topics.length < 2 || state.topic)) return;
    if (finished.scene === "love" && state.cursor < 2 || finished.scene === "encounter" && state.cursor < 4 || finished.scene === "sequence" && state.cursor < (finished.steps?.length ?? 1) || ["message","confession"].includes(finished.scene) && state.cursor < finished.dialogue.length) return;
    if (!replaying && current.active?.id !== finished.id) return;
    persistTimeline(completeEvent(current, finished.id, replaying));
    replayRef.current = null; setReplay(null); setPhone(false); setDialogue(null); setJournal(false); changeRest(null); setCinema(null);
    position(currentSession.returnPlayer); setDirection(currentSession.returnDirection); setStoryToast(finished); worldAudio.play("complete");
    if(finished.id === "our-story-finale") { setStoryToast(null); finaleElapsed.current=0; setFinale(true); }
  }

  useEffect(() => {
    const effect=cinemaRef.current;
    if(!effect || paused || needsLandscape) return;
    let handle=0, previous:number|undefined, elapsed=effect.elapsed;
    const duration=effect.kind === "kiss" ? 4000 : effect.kind === "sleep" ? 2700 : effect.kind === "reflection" ? 2400 : 1400;
    const tick=(now:number)=> {
      const dt=document.hidden || previous === undefined ? 0 : Math.min(100,now-previous); previous=now;
      elapsed+=dt;
      if(elapsed>=duration) { if(effect.sequence) advanceSequence(); else setCinema(null); return; }
      setCinema({...effect,elapsed});handle=requestAnimationFrame(tick);
    };
    handle=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(handle);
  }, [cinema?.id, paused, needsLandscape]);
  useEffect(() => {
    if(!finale || paused || needsLandscape) return;
    let handle=0,previous:number|undefined;
    const tick=(now:number)=> { if(!document.hidden && previous !== undefined) finaleElapsed.current+=Math.min(100,now-previous);previous=now;
      if(finaleElapsed.current>=3500) { setFinale(false);setJournal(true);return; }
      handle=requestAnimationFrame(tick);
    };
    handle=requestAnimationFrame(tick);return()=>cancelAnimationFrame(handle);
  },[finale,paused,needsLandscape]);

  function jumpStory() {
    if (session || legacyView) return;
    const next = nextEvent(timelineRef.current);
    if (!next) return;
    persistTimeline(jumpToNext(timelineRef.current));
    setJournal(false); setNotices([]); clearMovement();
    setDialogue({ speaker: "Ein paar Seiten weiter", text: `Die Zeit vergeht in eurem Tempo.\n\n${historicalDate(next.date)} – ${next.scene === "encounter" ? "Bei den Pferden in Radegast wartet die nächste Geschichte." : next.scene === "sequence" ? "Die nächste Szene wartet in eurer Welt. Folge ihrer goldenen Markierung." : "Ein gemeinsamer Moment wartet auf Felices Handy. Nimm in ihrem Zimmer am Bett oder Schreibtisch Platz."}`, action: "calendar" });
  }

  function openPhone() {
    if (!settled || !["felice-bed","felice-desk","felice-bed-edge"].includes(rest?.spot.id ?? "")) return;
    if (event && ["chat","love","confession","message"].includes(event.scene)) { clearMovement(); setPhone(true); }
    else if (upcoming && ["chat","love","confession","message"].includes(upcoming.scene) && upcoming.place === "bedroom" && eventStatus(timeline, upcoming) === "verfügbar") selectTimelineEvent(upcoming.id, true);
    else { clearMovement(); setPhone(true); }
  }

  function completePhotos() {
    const target = photoMoment?.target;
    setPhotoMoment(null); clearMovement();
    if (!target) { if (save.completed.includes("graduation")) registerLegacyCompletion("graduation"); return; }
    const next = advanceStory(save, target);
    setSave(next); spendTime(ACTION_MINUTES);
    if (!currentStep(next) && chapter) {
      registerLegacyCompletion(chapter.id);
      worldAudio.play("complete");
      setDialogue({ speaker: chapter.title, text: chapter.ending, ending: true });
    }
  }

  function completeShooting(score: number) {
    worldAudio.play("complete");
    useMemories.getState().complete(score);
    registerLegacyCompletion("shooting");
    if (save.chapter === "shooting" && step?.target === "shoot") setSave(advanceStory(save,"shoot"));
  }

  const completed = datedCompleted + STORY_EVENTS.filter(e => !e.confirmed && timeline.progress[e.id]?.completedAt).length;
  const labelStyle = (p: Point) => ({ left: `${p.x*100}%`, top: `${p.y*100}%` });
  const camera = cameraFor(player, cinema?.kind === "kiss" ? 1+Math.min(.3,cinema.elapsed/4000*.3) : 1);
  const questTarget = sequenceBeat?.target ?? (step ? step.place === save.place ? sceneEntities.find(e => e.id === step.target) : guide : undefined);
  const arrow = questTarget ? offscreenGuide(questTarget, camera) : null;

  return <main className="game-shell pixel-game version-five version-six version-061 version-065 version-07 version-075 version-08 version-09" data-name-mode={names.visibility} data-scene={inWorld ? save.place : "shooting"} data-chapter={event?.id ?? save.chapter ?? "free"} data-replay={Boolean(replay)} data-atmosphere-active={active} data-minute={day.minute} data-date={day.date} data-day={day.day} data-season={sceneSeason}>
    <link rel="preload" as="image" href={assetUrl("/rooms/felice-bedroom-rest-v065.png")}/>
    <link rel="preload" as="image" href={assetUrl("/characters/rest-poses-v065.png")}/>
    <link rel="preload" as="image" href={assetUrl("/characters/neighbors-poses-v065.png")}/>
    {Object.keys(WALK_ATLASES).map(sheet => <link key={sheet} rel="preload" as="image" href={assetUrl(sheet)}/>)}
    <div className={`pixel-viewport world-viewport ${save.place === "bedroom" ? "bedroom-viewport" : ""}`} hidden={!inWorld && phase !== "entering"} role="group" aria-label={PLACES[save.place].name}>
      <div key={save.place} className="world-scene world-camera" style={{ "--camera-x": `${camera.x*100}%`, "--camera-y": `${camera.y*100}%`, "--world-zoom": camera.zoom } as CSSProperties}>
        {event?.scene === "encounter" ? <RadegastPasture/> : <WorldBackdrop place={save.place} winter={winter} bedOccupied={bedOccupied}/>}
        {event?.scene === "encounter" && <EncounterElias position={eliasPoint} arriving={eventState?.cursor === 0} cursor={eventState?.cursor ?? 0}/>}
        {event?.scene === "sequence" && <SequenceCast event={event} beat={sequenceBeat} player={player} effect={cinema} place={save.place} conversing={Boolean(dialogue)}/> }
        {sequenceBeat && <div className="story-target" data-testid="story-target" data-x={sequenceBeat.target.x} data-y={sequenceBeat.target.y} style={labelStyle(sequenceBeat.target)}><span>✦</span><small>{sequenceBeat.label}</small></div>}
        {save.place === "bedroom" && <div className={`world-phone${event ? " has-message" : ""}`} style={labelStyle({ x: .6, y: .265 })} aria-label="Felices Handy auf dem Schreibtisch"><PhoneArt/>{event && <span>!</span>}</div>}
        {save.place === "radegast" && <span className="town-place-label" style={labelStyle({ x: .19, y: .17 })}>{event ? "Radegast · Bei den Pferden" : "Felices Wohnung"}</span>}
        {spots.map(spot => <div key={spot.id} className={`rest-spot rest-${spot.kind}${restTarget?.id === spot.id ? " nearby-rest" : ""}`} style={{...labelStyle(spot.furniture ?? spot.approach), zIndex: Math.round((spot.furniture ?? spot.position).y*100)+8}} aria-label={spot.name}>
          {spot.furniture && <BenchArt winter={winter && save.place === "garden"}/>}
          {restTarget?.id === spot.id && !rest && <span className="entity-name">{spot.name}</span>}
        </div>)}
        {exits.map(exit => <div key={exit.to} className={`world-exit ${guide?.to === exit.to ? "quest-exit" : ""}`} style={labelStyle(exit)}><span><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 19 19 5M6 5h13v13" fill="none" stroke="currentColor" strokeWidth="2"/></svg></span><small>{exit.label}</small></div>)}
        {sceneEntities.map(entity => <WorldEntity key={entity.id} entity={entity} actor={dialogue && actors[entity.id] ? {...actors[entity.id],moving:false} : actors[entity.id]} quest={step?.place === save.place && step.target === entity.id} nearby={active && nearbyEntity?.id === entity.id} />)}
        {save.place === "bedroom" && memoryProgress["goelzau-shooting"] && <span className="room-trophy" style={labelStyle({x:.855,y:.49})} aria-label="Erinnerungsmedaille" data-testid="shooting-medal">✦</span>}
        <div className={`room-player facing-${direction} pose-${restPose}${bedOccupied ? " in-bed" : ""}${walking && active ? " walking" : ""}`} data-testid="felice-player" data-pose={restPose} data-rest-id={rest?.spot.id} data-rest-phase={rest?.motion.phase ?? "none"} data-x={player.x.toFixed(3)} data-y={player.y.toFixed(3)} data-direction={direction} style={{...labelStyle(player),zIndex:bedOccupied ? 80 : Math.round(player.y*100)+10}}>
          {!bedOccupied && <CharacterArt id="felice" direction={direction} walking={walking && active || cinema?.kind === "walk"} frame={cinema?.kind === "walk" ? Math.floor(cinema.elapsed/180)%3 : walkFrame} pose={restPose}/>}<span className="room-player-label">Felice</span>
          {event?.scene === "encounter" && (eventState?.cursor ?? 0) >= 3 && <span className="pixel-chocolate felice-chocolate" aria-label="Felice behält die Schokolade"/>}
        </div>
        {bedOccupied && <span className="bed-name-label" style={labelStyle({ x: .245, y: .10 })}>Felice</span>}
        {rest?.companion && <div className={`room-player pose-${rest.companion.actor.pose} bench-companion`} style={{...labelStyle(rest.companion.actor.position), zIndex: Math.round(rest.companion.actor.position.y*100)+10}} aria-label={rest.companion.phase === "resting" ? "Elias sitzt neben Felice" : "Elias geht zum Ruheplatz"} data-testid="seated-elias" data-rest-id={rest.spot.id} data-pose={rest.companion.actor.pose}><CharacterArt id="elias" pose={rest.companion.actor.pose} direction={rest.companion.actor.direction} walking={rest.companion.actor.moving} frame={rest.companion.actor.frame}/><span className="room-player-label">Elias</span></div>}
        <WorldAtmosphere place={save.place} winter={winter}/>
        {save.place === "kitchen" && kitchenEffect && <div className={`kitchen-effect kitchen-${kitchenEffect}`} role="status"><span>{kitchenEffect === "breakfast" ? "Frühstück steht bereit" : kitchenEffect === "warm-drink" ? "Dein Getränk ist fertig" : "Die Küche ist aufgeräumt"}</span><i/><i/><i/></div>}
        <div className="daylight-shade" style={{ opacity: (1-light.daylight) * (["garden", "bus", "school", "radegast", "zoerbig","schoolway", "goelzau","playground","christmasmarket"].includes(save.place) ? .62 : .18) }} aria-hidden="true"/>
      </div>
      <StoryEffects effect={cinema} timeline={timeline} finale={finale}/>
      {active && arrow && <div className="offscreen-guide" style={labelStyle(arrow)} role="status" aria-label={`Aufgabenziel: ${step?.label}`}><span style={{ transform: `rotate(${arrow.angle}deg)` }}>➜</span><small>{guide?.label ?? "Dein nächstes Ziel"}</small></div>}
    </div>
    {(phase === "memory" || phase === "leaving") && <ShootingMemory blocked={paused || needsLandscape || transitioning} onComplete={completeShooting} onLeave={useMemories.getState().leave}/>}
    <GameUI started={started} onStart={() => { setStarted(true); if (!session && !save.chapter && !datedCompleted) setJournal(true); }} roomActive={inWorld && !needsLandscape && !journal && !dialogue && !phone && !photoMoment && !cinema && !finale} transitioning={transitioning} place={inWorld ? event?.scene === "encounter" ? "Radegast · Bei den Pferden" : PLACES[save.place].name : "Erinnerung · Gölzau"} completed={completed}/>
    {started && inWorld && !paused && !transitioning && <>
      <div className="day-clock" data-testid="day-clock"><time dateTime={day.date}>{historicalDate(day.date)}</time><strong>Uhrzeit: {clockText(day.minute)}</strong><small>{session ? "Aktuelle Spielzeit · während der Szene pausiert" : `Tag ${day.day} · ${activityAt(save.place, day.minute)}`}</small><span className="calendar-season" aria-label="Jahreszeit">{day.season} · Kalender</span></div>
      {(event || legacyView) && <div className="story-session-bar" role="status"><div><small>{legacyView ? "FIKTIONALISIERTER SZENENENTWURF" : replay ? "ERINNERUNG ERNEUT ERLEBEN" : `KAPITEL ${event?.chapterNumber ?? 1} · ${STORY_CHAPTERS.find(c=>c.number===(event?.chapterNumber??1))?.title ?? "Der Anfang"}`}</small><strong>{event ? `${eventDateText(event)} · ${event.title}` : "Historisches Datum noch offen"}</strong><span>{event ? event.source === "future" ? "Spielerischer Ausblick · kein abgeschlossenes historisches Ereignis" : event.source === "staged" ? "Spielbare Alltagsszene · Dialog und Ablauf sind gestaltet" : `Rekonstruierte Dialoge · Szenenzeit ${clockText(sceneMinute)}${event.staging.timeConfirmed ? " Uhr" : " Uhr (inszeniert)"}` : "Ablauf und Dialoge sind noch unbestätigt."}</span></div><button onClick={legacyView ? restoreDraft : leaveStory}>{replay || legacyView ? "Zurück in die Welt" : "Unterbrechen"}</button></div>}
      {notices[0] && active && <aside className="day-notice" role="status" data-testid="day-notice" key={`${notices[0].date}-${notices[0].minute}`}><strong>Uhrzeit: {clockText(notices[0].minute)}</strong><span>{notices[0].label}</span></aside>}
      <button className="world-phone-button" aria-label="Handy öffnen" onClick={()=>{clearMovement();setPhone(true);}}>▣ <span>Handy</span></button>
      <button className="journal-button" aria-label="Erinnerungsbuch öffnen" onClick={() => { clearMovement(); setJournal(true); }}>▤ <span>Erinnerungsbuch</span> <kbd>J</kbd></button>
      <aside className="quest-tracker" aria-live="polite"><small>{event ? `KAPITEL ${event.chapterNumber ?? 1} · ${STORY_CHAPTERS.find(c=>c.number===(event.chapterNumber??1))?.title ?? "Der Anfang"}` : chapter ? `Undatierter Entwurf · ${Math.min(save.step+1,chapter.steps.length)}/${chapter.steps.length}` : `Version 0.9 · ${datedCompleted}/${STORY_EVENTS.filter(e=>e.confirmed).length} Erinnerungen`}</small><strong>{event?.title ?? chapter?.title ?? "Schritt für Schritt"}</strong><p>{event ? event.scene === "sequence" ? sequenceBeat?.label ?? "Dieser Moment ist bewahrt" : event.scene === "encounter" ? eventState?.cursor === 0 ? "Elias kommt auf seinem Fahrrad an. Du kannst schon zu ihm laufen." : eventState?.cursor === 1 ? "Geh zu Elias auf dem Weg bei den Pferden." : eventState?.cursor === 2 ? "Elias hat Schokolade für dich mitgebracht." : eventState?.cursor === 3 ? "Du behältst die Schokolade bei dir und isst sie nicht." : "Elias ist ein bisschen verunsichert. Lasst dem Moment etwas Zeit." : "Nimm auf der Bettkante oder am Schreibtisch Platz und öffne dein Handy." : step?.label ?? (upcoming ? `${historicalDate(upcoming.date)} · ${upcoming.title}` : "Euer gemeinsames Jahr ist bewahrt. Entdecke die Welt und erlebe Erinnerungen erneut.")}</p>{!session && !legacyView && upcoming && <button className="story-next-button" onClick={eventStatus(timeline, upcoming) === "verfügbar" ? () => selectTimelineEvent(upcoming.id) : jumpStory}>{eventStatus(timeline,upcoming) === "verfügbar" ? "Geschichte erleben →" : "Zeit weiterblättern →"}</button>}{step && <span>{step.place === save.place ? "✦ Folge der goldenen Markierung" : `↗ ${guide?.label ?? PLACES[step.place].name}`}</span>}{save.bag.length > 0 && <div className="inventory">Tasche · {save.bag.join(" · ")}</div>}</aside>
      {active && rest && <div className="memory-interaction rest-actions"><span>{!settled ? rest.motion.phase === "leaving" ? "Du stehst auf" : "Du gehst zum Ruheplatz" : rest.spot.kind === "bed" ? "Du liegst wach im Bett" : rest.elias ? "Ein Moment mit Elias" : rest.spot.kind === "chair" ? "Du sitzt gemütlich" : "Du sitzt auf der Bank"}</span><button data-testid="world-interact" disabled={rest.motion.phase === "leaving"} onClick={interact}><kbd>E</kbd>Aufstehen · 10 Min.</button>{settled && (rest.spot.kind === "bed" && !event ? <button disabled={Boolean(legacyView) || day.date === STORY_END && day.minute >= 300} onClick={() => { setNotices([]); persistDay(sleepTimelineClock(dayRef.current)); position(rest.spot.approach); changeRest(null); setDialogue({ speaker: "Felice", text: "Ein neuer Morgen. Es ist 5:00 Uhr. Du bist ausgeschlafen.", morning: true }); }}>Schlafen bis 5:00 Uhr</button> : <><button onClick={() => spendTime(ACTION_MINUTES)}>Ausruhen · 10 Min.</button>{!event && !rest.elias && <button onClick={() => { const native = sourceEntities.find(entity => entity.art === "elias");
        const start = native ? actorsRef.current[native.id]?.position ?? native : SPAWNS[save.place];
        const shift = canWalk(save.place, rest.spot.approach.x + .07, rest.spot.approach.y) ? .07 : -.07;
        const companionSpot = { ...rest.spot, position: rest.spot.companion ?? rest.spot.position, approach: { x: rest.spot.approach.x + shift, y: rest.spot.approach.y } };
        changeRest({ ...rest, elias: true, companion: beginRest(save.place, start, companionSpot) }); spendTime(ACTION_MINUTES); }}>Mit Elias sitzen</button>}</>)}{settled && save.place === "bedroom" && ["felice-bed","felice-desk","felice-bed-edge"].includes(rest.spot.id) && <button className="phone-open-button" onClick={openPhone}>▣ Handy öffnen{event?.scene === "love" ? " · Neue Nachricht" : ""}</button>}</div>}
      {active && !rest && target && event?.scene !== "sequence" && <div className="memory-interaction"><span>{targetName}</span><button data-testid="world-interact" onClick={interact}><kbd>E</kbd>{restTarget ? restTarget.kind === "bed" ? "Hinlegen · 10 Min." : "Hinsetzen · 10 Min." : nearbyEntity ? nearbyEntity.id === "school-door" && day.minute < SCHOOL_END ? "Unterricht besuchen" : nearbyEntity.kind === "person" || nearbyEntity.kind === "dog" ? "Ansprechen · 10 Min." : save.place === "kitchen" ? "Aktion wählen" : "Anschauen / benutzen" : "Weitergehen · 30 Min."}</button></div>}
      {active && event?.scene === "sequence" && !sequenceBeat && <div className="memory-interaction sequence-actions"><span>Alle Schritte dieser Szene sind erlebt.</span><button onClick={finishCurrentEvent}>Diesen Moment bewahren</button></div>}
      {active && sequenceNearby && <div className="memory-interaction sequence-actions"><span>{sequenceBeat?.label}</span><button data-testid="world-interact" onClick={interact}><kbd>E</kbd>Diesen Moment erleben</button></div>}
      {active && encounterNearby && <div className="memory-interaction encounter-actions"><span>Bei den Pferden · Elias</span><button data-testid="world-interact" onClick={interact}><kbd>E</kbd>{eventState?.cursor === 1 ? "Gespräch beginnen" : eventState?.cursor === 2 ? "Schokolade annehmen" : eventState?.cursor === 3 ? "Schokolade bei dir behalten" : "Einen Moment bleiben"}</button></div>}
      {!save.chapter && !event && <div className="world-welcome">Dein Zimmer ist erst der Anfang. Geh durch die Tür oder öffne das Buch.</div>}
    </>}
    {photoMoment && <GraduationPhotos blocked={paused || needsLandscape} onComplete={completePhotos}/> }
    {phone && event && eventState && ["chat","love","confession","message"].includes(event.scene) && <StoryPhone event={event} state={eventState} replay={Boolean(replay)} paused={paused} onPause={() => { if (paused) void worldAudio.unlock(); useInput.getState().setPaused(!paused); clearMovement(); }} blocked={paused || needsLandscape} onChange={changeEventState} onClose={() => { setPhone(false); clearMovement(); }} onComplete={finishCurrentEvent} timeline={timeline} onSelectMemory={id=>{setPhone(false);selectTimelineEvent(id);}} onOpenAlbum={()=>{setPhone(false);setJournal(true);}} onJump={()=>{setPhone(false);jumpStory();}}/>}
    {phone && (!event || !["chat","love","confession","message"].includes(event.scene)) && <PhoneHub timeline={timeline} activeId={session?.id} paused={paused} onPause={()=>{useInput.getState().setPaused(!paused);clearMovement();}} blocked={paused || needsLandscape} onClose={()=>setPhone(false)} onSelectMemory={id=>{setPhone(false);selectTimelineEvent(id);}} onJump={()=>{setPhone(false);jumpStory();}} onOpenAlbum={()=>{setPhone(false);setJournal(true);}}/>}
    {storyToast && started && <aside className={`story-unlocked${storyToast.special ? " special-memory" : ""}`} role="status"><span aria-hidden="true">{storyToast.special ? "♥" : "✦"}</span><div><small>ERINNERUNG BEWAHRT</small><strong>{historicalDate(storyToast.date)} · {storyToast.title}</strong></div><button onClick={() => { setStoryToast(null); clearMovement(); setJournal(true); }}>Im Buch ansehen</button><button aria-label="Erinnerungshinweis schließen" onClick={() => setStoryToast(null)}>×</button></aside>}
    {journal && <dialog ref={journalRef} className="story-modal journal-modal" onCancel={() => { setJournal(false); clearMovement(); }}>
      <div className="journal-heading"><div><small>FELICE × ELIAS · VERSION 0.9</small><h1>Unsere Geschichte</h1><p>{datedCompleted} datierte Erinnerungen bewahrt · Historische Daten bleiben beim Wiederholen erhalten.</p></div><div className="journal-duo" aria-label="Felice und Elias"><CharacterArt id="felice"/><CharacterArt id="elias"/></div><button className="modal-close" aria-label="Erinnerungsbuch schließen" onClick={() => setJournal(false)}>×</button></div>
      <TimelineJournal save={timeline} busyId={session?.id} draftActive={Boolean(legacyView)} onSelect={selectTimelineEvent} onJump={jumpStory} onDraft={e => { if(e.chapter) selectChapter(e.chapter); }}/>
      <WorldMap place={save.place}/>
      <NamesPanel save={names} error={namesError} onRename={changeName} onVisibility={mode => persistNames({ ...namesRef.current, visibility: mode })}/>
      <div className="journal-bottom"><section><h2>Eure Orte</h2><p>Wohnung / Garten ↔ Radegast ↔ Haltestelle ↔ Zörbig · Markt ↔ Schulweg ↔ Pausenhof ↔ Turnhalle. Von Radegast nach Gölzau zum Schützenhaus.</p><p>WASD / Pfeile oder Joystick · E zum Sprechen & Benutzen · J für das Buch · Esc für Pause</p><small>Fortschritt wird automatisch auf diesem Gerät gespeichert. Ergänzte Dialoge und Szenen sind fiktionalisierte Rekonstruktionen. Historische Angaben und Spielzeit werden getrennt gespeichert.</small></section><button className="memory-primary" onClick={() => setJournal(false)}>Zurück ins Spiel</button></div>
    </dialog>}
    {dialogue && <DialogueBox speaker={dialogue.speaker} key={`${dialogue.speaker}:${dialogue.text}:${dialogue.choices?.join("|")}`} art={dialogue.art ?? speakerGraphic(dialogue.speaker) ?? undefined} text={dialogue.text} emotion={dialogue.emotion} choices={dialogue.choices} paused={paused} blocked={paused || needsLandscape} onAdvance={finishDialogue} onCancel={()=>{setDialogue(null);clearMovement();}} onPause={()=>{useInput.getState().setPaused(!paused);clearMovement();}} ending={dialogue.ending} note={dialogue.action === "calendar" ? "STORY-KALENDER" : dialogue.action === "sequence" || dialogue.action === "encounter" ? "FIKTIONALISIERTE REKONSTRUKTION" : "SPIELDIALOG · GESTALTETE WORTE"}/>}

    {(saveError || memoryError) && started && <div className="memory-save-warning" role="status">{saveError ?? memoryError}<button onClick={() => {
      if (memoryError) useMemories.getState().retrySave();
      if (saveError) { try { parseStory(window.localStorage.getItem(STORY_KEY)); if (!readable.current) { setSaveError("Bitte lade die Seite neu, um den wieder lesbaren Spielstand sicher fortzusetzen."); return; } window.localStorage.setItem(STORY_KEY,JSON.stringify(save)); setSaveError(null); } catch { setSaveError("Speichern bleibt nicht möglich. Bitte erlaube lokale Browserdaten für das Spiel."); } }
    }}>Erneut speichern</button></div>}
    {dayError && started && <div className="day-save-warning" role="status">{dayError}{timelineReadable.current && <button onClick={() => persistTimeline(timelineRef.current)}>Erneut speichern</button>}</div>}
    <MemoryTransition/>
    {needsLandscape && <div className="rotate-screen" role="status"><div className="rotate-phone">↻</div><strong>Handy bitte quer halten</strong><span>Im Querformat ist genug Platz für eure Welt und den Joystick.</span></div>}
  </main>;
}

function WorldEntity({ entity, actor, quest, nearby }: { entity: Entity; actor?: Actor; quest: boolean; nearby: boolean }) {
  const point = entity.display ?? entity;
  const pose = actor?.pose ?? "standing";
  return <div className={`world-entity entity-${entity.kind} pose-${pose} ${actor?.moving ? "actor-walking" : ""} ${quest ? "quest-entity" : ""} ${nearby ? "nearby-entity" : ""}`} data-entity={entity.id} data-rest-id={actor?.restId} data-friend={!["mother","stepfather","halfsister","partner-one","stepsister","partner-two"].includes(entity.art)} data-pose={pose} data-moving={actor?.moving ?? false} data-x={point.x.toFixed(3)} data-y={point.y.toFixed(3)} style={{...(entity.kind !== "item" ? characterStyle(entity.kind === "dog" ? "dog" : entity.art) : {}),left:`${point.x*100}%`,top:`${point.y*100}%`,zIndex:entity.display ? 110 : Math.round(entity.y*100)+9}} aria-label={entity.name}>
    {quest && <span className="quest-marker">!</span>}{entity.kind === "person" ? <CharacterArt id={entity.art} pose={pose} walking={actor?.moving} frame={actor?.frame} direction={actor?.direction}/> : entity.kind === "dog" ? <CharacterArt id="dog"/> : entity.art === "action" ? <span className="kitchen-action-marker" aria-hidden="true">✦</span> : entity.art === "landmark" ? <span className="landmark-marker" aria-hidden="true">◇</span> : <ItemArt art={entity.art}/>}<span className="entity-name">{entity.name}</span>
  </div>;
}

const ELIAS_GUEST: Entity = { id: "elias-guest", name: "Elias", x: .5, y: .7, kind: "person", art: "elias", text: "Ich bleibe noch ein bisschen bei dir. Machen wir zusammen eine Pause?" };
