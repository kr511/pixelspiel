import { useState } from "react";
import { assetUrl } from "./assets";
import { CharacterArt } from "./WorldArt";
import type { Point } from "./story";

export function RadegastPasture({ preview = false }: { preview?: boolean }) {
  const [failed, setFailed] = useState(false);
  // The 4:3 meeting-place painting is shown as a square crop (x -40 of 320 units) that keeps the pavilion and the road.
  if (preview && !failed) return <div className="pasture-preview" role="img" aria-label="Der Treffpunkt in Radegast" style={{ backgroundImage: `url(${assetUrl("/rooms/story-treffpunkt-v11.webp")})` }}/>;
  if (!failed) return <svg className="scene-backdrop pasture-scene story-pixel-backdrop" viewBox="0 0 240 240" preserveAspectRatio="none" aria-hidden="true">
    <image href={assetUrl("/rooms/story-treffpunkt-v11.webp")} x="-40" width="320" height="240" preserveAspectRatio="none" onError={() => setFailed(true)}/>
  </svg>;
  return <svg className={preview ? "pasture-preview" : "scene-backdrop pasture-scene"} viewBox="0 0 240 240" preserveAspectRatio="none" shapeRendering="crispEdges" role={preview ? "img" : undefined} aria-label={preview ? "Der Treffpunkt in Radegast" : undefined} aria-hidden={preview ? undefined : true}>
    <rect width="240" height="240" fill="#8a925a"/><rect y="200" width="240" height="40" fill="#727e50"/>
    <path d="M85 0H104L122 76 151 148 200 240H154L122 167 103 114Z" fill="#c3ad83"/><path d="M94 0L108 60 139 145 179 240" fill="none" stroke="#d8c39b" strokeWidth="8"/>
    {[12,34,56,78,100,122,144,166,188,210,232].flatMap((x,i) => [<path key={`g${i}`} d={`M${x} ${15+i*17%190}h3v3h-3M${(x+19)%230} ${65+i*13%140}h4v2h-4`} fill={i%2 ? "#aa9d65" : "#68774f"}/>, <rect key={`l${i}`} x={(x*3)%230} y={23+i*18} width="3" height="2" fill={i%2 ? "#c68947" : "#e0b05d"}/>])}
    <path d="M15 49H80M15 64H84M15 145H112M15 159H117" stroke="#d3b081" strokeWidth="4"/><path d="M15 45V166M36 45V68M57 45V68M78 45V68M38 140V166M63 140V166M88 140V166M110 140V166" stroke="#7b6247" strokeWidth="4"/>
    <path d="M17 50H80M17 146H112" stroke="#ebc99d" strokeWidth="2"/>
    <Horse x={33} y={84} color="#735143"/><Horse x={69} y={115} color="#c3a47d"/>
    {[{x:6,y:12},{x:46,y:4},{x:134,y:12},{x:194,y:24},{x:193,y:131},{x:12,y:193}].map((p,i) => <g key={i} transform={`translate(${p.x} ${p.y})`}><rect x="12" y="14" width="5" height="28" fill="#674c37"/><path d="M0 8H7V0H26V5H34V19H28V28H9V24H0Z" fill={i%2 ? "#b37d45" : "#b5984c"}/><path d="M5 8H12V3H23V8H29V15H20V20H8V15H5Z" fill={i%2 ? "#d39a50" : "#d5b767"}/></g>)}
    <rect x="173" y="72" width="38" height="29" fill="#655947"/><rect x="169" y="67" width="47" height="7" fill="#9b6249"/><rect x="184" y="80" width="13" height="21" fill="#3e4035"/><path d="M175 103H212" stroke="#b7a078" strokeWidth="3"/>
    <rect x="20" y="175" width="13" height="10" fill="#777767"/><rect x="21" y="174" width="11" height="3" fill="#acaa8a"/>
  </svg>;
}
function Horse({ x, y, color }: { x: number; y: number; color: string }) {
  return <g transform={`translate(${x} ${y})`}><ellipse cx="12" cy="19" rx="17" ry="4" fill="#465d4240"/><path d="M0 6H21V10H25V15H19V21H15V15H6V21H2V13H-2V8Z" fill={color}/><path d="M20 10V0H28V9H23V13Z" fill={color}/><path d="M21 1V-3H24V1M26 1V-3H28V1" stroke="#594539" strokeWidth="2"/><path d="M19 2V11M-2 7H-6V15" stroke="#443c31" strokeWidth="3"/><rect x="26" y="3" width="2" height="2" fill="#332f2a"/><rect x="25" y="7" width="4" height="2" fill="#ded0b2"/></g>;
}

export function BicycleArt() {
  return <svg className="story-bicycle" viewBox="0 0 70 36" shapeRendering="crispEdges" aria-hidden="true"><path d="M4 28H66" stroke="#2d382c40" strokeWidth="6"/><circle cx="13" cy="22" r="11" fill="#acb18e" stroke="#403c35" strokeWidth="3"/><circle cx="56" cy="22" r="11" fill="#acb18e" stroke="#403c35" strokeWidth="3"/><path d="M13 22L26 8 37 22H13M26 8H48L37 22M48 8L56 22M48 8V2H56M26 8V3H21M32 3H22" fill="none" stroke="#648b8b" strokeWidth="3"/><path d="M25 3H33" stroke="#403c35" strokeWidth="3"/></svg>;
}

export function EncounterElias({ position, arriving, cursor }: { position: Point; arriving: boolean; cursor: number }) {
  return <div className={`room-player story-elias${arriving ? " arriving-on-bike" : ""}`} style={{ left: `${position.x*100}%`, top: `${position.y*100}%`, zIndex: Math.round(position.y*100)+9 }} data-testid="encounter-elias" data-arriving={arriving} aria-label={arriving ? "Elias kommt mit dem Fahrrad an" : "Elias am Treffpunkt"}><CharacterArt id="elias" direction={arriving ? "back" : "left"}/><BicycleArt/><span className="room-player-label">Elias</span>{cursor >= 2 && cursor <= 3 && <span className="pixel-chocolate" aria-label="Mitgebrachte Schokolade"/>}{cursor >= 4 && <span className="emotional-pause" aria-label="Elias ist etwas verunsichert">…</span>}</div>;
}

export function PhoneArt() {
  return <svg className="pixel-phone-art" viewBox="0 0 16 24" shapeRendering="crispEdges" aria-hidden="true"><path d="M2 0H14V24H2Z" fill="#303a3d"/><path d="M4 3H12V19H4Z" fill="#a9c5aa"/><path d="M5 7H11V9H5M5 11H10V13H5" stroke="#f2ecd2" strokeWidth="1"/><rect x="7" y="21" width="2" height="1" fill="#c8bc93"/></svg>;
}
