import { canWalk, type Entity, type Place, type Point } from "./story.ts";
import { walkingRoute, type Actor } from "./actors.ts";
import { movementStep, walkingFrame } from "./motion.ts";
// Ambient routines use the existing actors; story casts are never hidden.
export function routineEntities(place: Place, minute: number, entities: Entity[], keepElias = false): Entity[] {
  if (place === "school" && (minute < 420 || minute >= 1080)) return entities.filter(e => e.kind !== "person" || keepElias && e.art === "elias");
  return entities;
}

type Follower = Actor & { followTarget?: Point };

/** Reuse the world collision routes; normalized movement keeps pace with Felice. */
export function advanceFollower(place: Place, actor: Actor, player: Point, seconds: number): Follower {
  const follower = actor as Follower;
  const target = [{x:player.x+.075,y:player.y},{x:player.x-.075,y:player.y},{x:player.x,y:player.y+.075},player].find(point => canWalk(place,point.x,point.y)) ?? player;
  const distanceToTarget = Math.hypot(target.x-actor.position.x,target.y-actor.position.y);
  if(distanceToTarget < .025) return { ...actor, moving:false, direction:Math.abs(player.x-actor.position.x)>Math.abs(player.y-actor.position.y) ? player.x>actor.position.x ? "right" : "left" : player.y>actor.position.y ? "front" : "back", route:[], followTarget:target };
  const clearSegment = (destination:Point) => {
    const count=Math.max(1,Math.ceil(Math.hypot(destination.x-actor.position.x,destination.y-actor.position.y)/.01));
    for(let i=1;i<=count;i++) if(!canWalk(place,actor.position.x+(destination.x-actor.position.x)*i/count,actor.position.y+(destination.y-actor.position.y)*i/count)) return false;
    return true;
  };
  let route=clearSegment(target) ? [target] : follower.route;
  if(!clearSegment(target) && (!follower.followTarget || Math.hypot(target.x-follower.followTarget.x,target.y-follower.followTarget.y)>.075 || !route.length)) route=walkingRoute(place,actor.position,target);
  while(route.length && Math.hypot(route[0].x-actor.position.x,route[0].y-actor.position.y)<.018) route=route.slice(1);
  const waypoint=route[0];
  if(!waypoint) return {...actor,moving:false,route:[],followTarget:target};
  const dx=waypoint.x-actor.position.x,dy=waypoint.y-actor.position.y,length=Math.hypot(dx,dy);
  const position=movementStep(actor.position,{x:dx/length,y:dy/length},Math.min(seconds*1.08,length/.19),(x,y)=>canWalk(place,x,y));
  const distance=actor.distance+Math.hypot(position.x-actor.position.x,position.y-actor.position.y);
  return {...actor,position,pose:"standing",pending:undefined,restId:undefined,moving:Math.hypot(position.x-actor.position.x,position.y-actor.position.y)>.00001,direction:Math.abs(dx)>Math.abs(dy) ? dx>0 ? "right" : "left" : dy>0 ? "front" : "back",distance,frame:walkingFrame(distance),route,followTarget:target};
}
