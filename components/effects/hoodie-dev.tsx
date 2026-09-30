"use client";

import { cn } from "@/lib/utils";
import { Hoodie3D } from "@/components/effects/hoodie-3d";

type Props = {
  className?: string;
  children?: React.ReactNode;
  says?: string;
};

/** A textured 3D bust. The poster is only for loading / unavailable GPU /
 * reduced motion; there is no sprite lookup or image interpolation loop.
 */
export function HoodieDev({ className, children, says }: Props) {
  return (
    <div className={cn("hoodie-dev", className)}>
      <div className="hoodie-dev-breathe" role="img" aria-label="3D character in a black hoodie, looking toward the pointer">
        <div className="hoodie-poster" />
        <Hoodie3D />
      </div>
      {says ? (
        <p className="hoodie-dev-says">{says}<span aria-hidden="true">&darr;</span></p>
      ) : null}
      <div className="hoodie-dev-rig">{children}</div>
    </div>
  );
}
