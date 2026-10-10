"use client";

import { useId } from "react";
import { CHARACTER_GRAPHICS, characterGraphic } from "./graphics";
import { EMOTION_NAMES, portraitSeed, type Emotion } from "./dialogue";
import { assetUrl } from "./assets";

export type PixelPortraitProps = { id: string; emotion?: Emotion };

/** Existing hair/clothes and a separately drawn expressive pixel face. */
export function PixelPortrait({ id, emotion = "neutral" }: PixelPortraitProps) {
  const clip = useId();
  const normalized = id.toLowerCase();
  const isFelice = normalized === "felice";
  const isElias = normalized === "elias";
  const main = isFelice || isElias;
  const known = normalized in CHARACTER_GRAPHICS;
  const graphic = characterGraphic(normalized).portrait;
  const seed = portraitSeed(normalized);
  const skin = isFelice ? "#f5b69a" : isElias ? "#ffc59d" : "#f1bd9e";
  const shadow = isFelice ? "#d98d79" : "#dc9c7a";
  const eyes = isElias ? "#658ca2" : "#865b40";
  const portraitFrame = isFelice ? "155 15 155 180" : "0 0 100 100";
  const dimensions = isFelice ? { x: 0, y: 0, width: 1448, height: 1086 } : { x: -graphic.column * 100, y: -graphic.row * 100, width: graphic.columns * 100, height: graphic.rows * 100 };
  const variant = seed % 5;

  return <svg className={`pixel-portrait portrait-${main ? normalized : "npc"} emotion-${emotion}`} data-testid="dialogue-portrait" data-character={normalized} data-emotion={emotion} viewBox="0 0 100 112" role="img" aria-label={`${normalized === "dog" ? "Anuk" : id} · ${EMOTION_NAMES[emotion]}`} shapeRendering="crispEdges">
    <defs><clipPath id={clip}><path d="M6 0H94V6H100V106H94V112H6V106H0V6H6Z"/></clipPath></defs>
    <g clipPath={`url(#${clip})`}>
      <path d="M0 0H100V112H0Z" fill={emotion === "love" ? "#59404b" : emotion === "sad" ? "#36444f" : "#394d46"}/>
      <path d="M0 80H100V112H0Z" fill="#293c37"/>
      {normalized === "dog" ? <svg x="3" y="12" width="94" height="100" viewBox="0 0 100 100"><image href={assetUrl(graphic.sheet)} width="100" height="100" preserveAspectRatio="xMidYMax meet"/></svg> : normalized === "narrator" ? <NarratorPortrait/> : <>
        {known ? <svg x="0" y="0" width="100" height="112" viewBox={portraitFrame} preserveAspectRatio={isFelice ? "xMidYMin meet" : "none"} overflow="hidden"><image href={assetUrl(graphic.sheet)} {...dimensions} preserveAspectRatio="none"/></svg> : <FallbackPortrait seed={seed} skin={skin}/>}
        {/* Faces have real independent eyes, eyebrows and mouths for all eight emotions. */}
        {main ? <g transform={isElias ? "translate(0 5) rotate(-9 50 50)" : "translate(0 -1)"} data-face-expression={emotion}>
          <path d="M30 36H69V48H73V57H68V63H61V67H40V63H33V57H28V46H30Z" fill={skin}/>
          <path d="M30 51H33V57H37V61H41V63H60V61H65V58H68V53H71V58H68V64H61V68H40V64H33V58H30Z" fill={shadow} opacity=".45"/>
          <Face emotion={emotion} skin={skin} eyeColor={eyes}/>
        </g> : <g transform="translate(0 -1)" data-face-expression={emotion}>
          <path d="M30 29H69V42H73V56H69V64H62V68H40V64H32V55H28V40H30Z" fill={skin}/>
          <Face emotion={emotion} skin={skin} eyeColor={eyes}/>
          {/* Atlas sharing does not make two named NPC portraits identical. */}
          {variant === 0 && <path d="M29 38H45V48H29ZM55 38H71V48H55ZM45 41H55" fill="none" stroke="#645943" strokeWidth="2"/>}
          {variant === 1 && <path d="M67 52H70V58H67Z" fill="#e2c17b"/>}
          {variant === 2 && <path d="M48 63H58V65H48Z" fill="#a67858"/>}
          {variant === 3 && <path d="M68 34H73V38H68Z" fill="#bd7882"/>}
        </g>}
      </>}
      {emotion === "love" && <g className="portrait-hearts" fill="#dc98a4"><path d="M8 8H12V6H16V10H18V14H14V18H10V14H6V10H8Z"/><path d="M82 24H85V22H89V25H92V29H88V33H85V29H81V25H82Z"/></g>}
      {emotion === "surprised" && <path d="M83 7H88V19H83ZM83 23H88V28H83Z" fill="#f5d9a0"/>}
      {emotion === "thoughtful" && <path d="M78 11H82V15H78ZM85 7H89V11H85ZM92 3H96V7H92Z" fill="#acc7c5"/>}
    </g>
  </svg>;
}

function Face({ emotion, skin, eyeColor }: { emotion: Emotion; skin: string; eyeColor: string }) {
  const shy = emotion === "shy";
  const smiling = emotion === "happy" || emotion === "love";
  const closed = emotion === "laughing" || emotion === "happy";
  const sad = emotion === "sad";
  const surprised = emotion === "surprised";
  const eyeY = surprised ? 40 : 42;
  return <>
    {/* Brows change shape independently of eyes. */}
    {sad ? <path d="M32 35H36V33H42V36H36V38H32ZM56 33H62V35H66V38H62V36H56Z" fill="#684b3b"/> : shy ? <path d="M31 36H41V38H31ZM58 36H68V38H58Z" fill="#795340"/> : surprised ? <path d="M32 32H43V34H32ZM56 32H67V34H56Z" fill="#795340"/> : <path d="M31 36H42V38H31ZM57 36H68V38H57Z" fill="#684b3b"/>}
    {closed ? <path d={emotion === "laughing" ? "M31 43H34V40H39V43H42V45H39V43H34V45H31ZM57 43H60V40H65V43H68V45H65V43H60V45H57Z" : "M31 42H34V44H39V42H42V45H39V47H34V45H31ZM57 42H60V44H65V42H68V45H65V47H60V45H57Z"} fill="#493b33"/> : <>
      <path d={`M31 ${eyeY}H43V${eyeY+8}H31ZM56 ${eyeY}H68V${eyeY+8}H56Z`} fill="#fff5df"/>
      <path d={`M${shy ? 31 : 34} ${eyeY+1}H${shy ? 38 : 41}V${eyeY+8}H${shy ? 31 : 34}ZM${shy ? 56 : 59} ${eyeY+1}H${shy ? 63 : 66}V${eyeY+8}H${shy ? 56 : 59}Z`} fill={eyeColor}/>
      <path d={`M${shy ? 32 : 36} ${eyeY+2}H${shy ? 36 : 39}V${eyeY+7}H${shy ? 32 : 36}ZM${shy ? 57 : 61} ${eyeY+2}H${shy ? 61 : 64}V${eyeY+7}H${shy ? 57 : 61}Z`} fill="#303535"/>
      <path d={`M34 ${eyeY+1}H37V${eyeY+3}H34ZM59 ${eyeY+1}H62V${eyeY+3}H59Z`} fill="#fffdf0"/>
      <path d={`M30 ${eyeY-1}H43V${eyeY+1}H30ZM56 ${eyeY-1}H69V${eyeY+1}H56Z`} fill="#493b33"/>
      {sad && <path d="M29 49H32V55H29ZM68 49H71V55H68Z" fill="#a5d0d9"/>}
      {emotion === "thoughtful" && <path d="M31 41H43V44H31Z" fill={skin}/>}
    </>}
    <path d="M48 49H51V52H54V54H48Z" fill="#d89179" opacity=".8"/>
    {(shy || smiling || emotion === "laughing") && <path d="M26 49H34V53H26ZM66 49H74V53H66Z" fill={shy ? "#df8492" : "#e79d96"} opacity={shy ? ".85" : ".55"}/>}
    {emotion === "laughing" ? <><path d="M42 56H59V61H56V65H46V62H42Z" fill="#7e4544"/><path d="M44 56H57V58H44Z" fill="#fff5df"/><path d="M48 62H54V65H48Z" fill="#d38b91"/></> : surprised ? <><path d="M46 57H54V66H46Z" fill="#7e4544"/><path d="M48 59H52V64H48Z" fill="#b66e6d"/></> : sad ? <path d="M42 62H45V59H56V62H59V64H55V62H46V64H42Z" fill="#9d5f58"/> : smiling ? <path d="M41 56H44V59H56V56H59V61H56V63H44V61H41Z" fill="#9d5f58"/> : shy ? <path d="M45 59H54V61H45Z" fill="#a66d67"/> : emotion === "thoughtful" ? <path d="M46 59H58V61H46Z" fill="#a66d67"/> : <path d="M43 59H57V61H43Z" fill="#a66d67"/>}
  </>;
}

function FallbackPortrait({ seed, skin }: { seed: number; skin: string }) {
  const hair = ["#73503e", "#a0784a", "#454244", "#9a543c", "#867868"][seed % 5];
  const shirt = ["#57777e", "#986b75", "#7e8258", "#5b6684", "#947d55"][Math.floor(seed / 5) % 5];
  return <><path d="M25 13H75V20H82V73H73V81H24V73H17V25H25Z" fill={hair}/><path d="M28 75H72V82H84V93H92V112H8V93H16V82H28Z" fill={shirt}/><path d="M42 62H60V78H42Z" fill={skin}/><path d="M26 22H73V29H67V34H28Z" fill={hair}/></>;
}

function NarratorPortrait() {
  return <><path d="M20 31H48V35H52V31H80V86H54V91H46V86H20Z" fill="#d6c5a1"/><path d="M25 37H45V79H25ZM55 37H75V79H55Z" fill="#efdfbd"/><path d="M29 44H41V47H29ZM29 54H41V57H29ZM59 44H71V47H59ZM59 54H71V57H59Z" fill="#ad9974"/><path d="M38 14H44V11H50V16H54V22H50V28H44V22H38Z" fill="#d7949d"/></>;
}
