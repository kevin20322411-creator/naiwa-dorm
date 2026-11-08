(function(root){
  'use strict';

  // An original, simplified courtyard inspired by Suzhou's old campus buildings.
  // The character is layered over this scene by the home page.
  const scene=`
    <div class="home-campus-scene" aria-hidden="true">
      <svg viewBox="0 0 520 510" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="home-campus-sky" x1="260" y1="27" x2="260" y2="420" gradientUnits="userSpaceOnUse">
            <stop stop-color="#e7edde"/>
            <stop offset="1" stop-color="#f5f3e8"/>
          </linearGradient>
          <linearGradient id="home-campus-river" x1="423" y1="253" x2="415" y2="404" gradientUnits="userSpaceOnUse">
            <stop stop-color="#b6cec0"/>
            <stop offset="1" stop-color="#d2ded0"/>
          </linearGradient>
          <clipPath id="home-campus-outline">
            <path d="M70 88C108 32 190 20 274 29C369 14 445 68 473 149C502 228 482 336 438 389C395 442 294 454 191 435C101 444 48 393 39 310C19 220 28 147 70 88Z"/>
          </clipPath>
        </defs>

        <!-- Light, open sky and the distant canopy. -->
        <g clip-path="url(#home-campus-outline)">
          <path d="M18 17H504V448H18Z" fill="url(#home-campus-sky)"/>
          <circle class="home-campus-sun" cx="363" cy="109" r="41" fill="#e8c56a"/>
          <path d="M317 114C325 105 339 103 348 110C354 94 376 92 386 108C400 105 411 111 412 120H315Z" fill="#f8f7ed"/>
          <path d="M185 72C190 63 204 62 210 69C219 61 233 65 237 74H181Z" fill="#f7f7ef" opacity=".85"/>
          <path d="M38 247C77 204 102 223 137 210C173 184 203 211 226 229C251 212 283 224 304 242C342 207 374 215 402 236C433 217 469 228 491 252V333H32Z" fill="#c4d1b4"/>
          <path d="M41 281C81 250 125 255 160 276C203 249 244 251 288 283C333 258 382 254 417 278C442 260 471 264 490 282V346H32Z" fill="#a7ba95"/>

          <!-- Grey brick clock tower, set behind the foreground character. -->
          <g class="home-campus-tower">
            <path d="M102 287H203V302H102Z" fill="#a4ac98"/>
            <path d="M108 179H196V287H108Z" fill="#c9cab6"/>
            <path d="M174 179H196V287H174Z" fill="#b4bba7"/>
            <path d="M115 168H192V180H109Z" fill="#778778"/>
            <path d="M124 122H181V172H124Z" fill="#c4c6b0"/>
            <path d="M168 122H181V172H168Z" fill="#b1baa5"/>
            <path d="M119 120L153 91L187 120L180 125H126Z" fill="#637b6d"/>
            <path d="M151 91V81" stroke="#536e5f" stroke-width="2" stroke-linecap="round"/>
            <path d="M118 173H188" stroke="#e5e3d2" stroke-width="3"/>
            <path d="M110 211H173M110 248H173" stroke="#b4bca5" stroke-width="1.5"/>
            <path d="M174 213H194M174 250H194" stroke="#9eae99" stroke-width="1.5"/>
            <circle cx="151" cy="143" r="15" fill="#f3eed7" stroke="#8b9b85" stroke-width="3"/>
            <path d="M151 132V143L159 148" stroke="#536f5b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M151 129V131M151 155V157M137 143H139M163 143H165" stroke="#a7ae91" stroke-width="1.5"/>
            <path d="M124 202V194A9 9 0 0 1 142 194V202Z" fill="#6e8776"/>
            <path d="M152 202V194A9 9 0 0 1 170 194V202Z" fill="#6e8776"/>
            <path d="M124 239V231A9 9 0 0 1 142 231V239Z" fill="#78917c"/>
            <path d="M152 239V231A9 9 0 0 1 170 231V239Z" fill="#78917c"/>
            <path d="M137 287V270A14 14 0 0 1 165 270V287Z" fill="#6f8571"/>
            <path d="M151 260V286" stroke="#a1b094" stroke-width="2"/>
            <path d="M119 287V183M181 287V183" stroke="#dadbc6" stroke-width="4"/>
            <path d="M95 299H207V306H95Z" fill="#b9bea9"/>
          </g>

          <!-- A low, asymmetric archway and the river on the east side. -->
          <g class="home-campus-gate">
            <path d="M341 242H419V306H341Z" fill="#c9cbb7"/>
            <path d="M350 305V272A17 17 0 0 1 384 272V305Z" fill="#7d9983"/>
            <path d="M395 263H410V286H395Z" fill="#9baf96"/>
            <path d="M334 239L380 213L426 239V246H334Z" fill="#6e8171"/>
            <path d="M345 241L380 221L415 241" stroke="#839481" stroke-width="2" stroke-linejoin="round"/>
            <path d="M341 249H419" stroke="#e1dfc8" stroke-width="3"/>
            <path d="M335 305H424V312H335Z" fill="#b3bea6"/>
          </g>
          <path d="M459 261C420 286 408 310 417 335C428 361 407 385 365 406L446 430C486 395 493 352 476 323C467 307 480 281 493 272Z" fill="url(#home-campus-river)"/>
          <path d="M456 262C417 289 407 311 416 335C426 361 404 386 365 406" stroke="#e8e7d5" stroke-width="10" stroke-linecap="round"/>
          <path d="M451 291L473 290M435 320L458 319M447 349L472 346M414 380L437 378" stroke="#edf0e4" stroke-width="2" stroke-linecap="round"/>
          <path d="M382 302L450 314" stroke="#8fa487" stroke-width="5" stroke-linecap="round"/>
          <path d="M393 302V313M409 305V316M426 308V319M441 310V322" stroke="#8fa487" stroke-width="3" stroke-linecap="round"/>
          <path d="M382 312L450 324" stroke="#d5d9bf" stroke-width="6" stroke-linecap="round"/>

          <!-- Winding lawn edges preserve a large, quiet center. -->
          <path d="M30 322C91 295 131 312 173 325C201 332 238 319 264 301C284 287 311 291 341 309C365 324 391 327 418 323C386 357 380 391 333 418L58 420Z" fill="#94ac7e"/>
          <path d="M210 295C239 306 251 321 243 336C233 355 190 360 162 376C146 385 139 399 140 418H322C303 399 282 387 265 380C242 370 253 357 278 345C312 328 302 303 277 292Z" fill="#e3ddbf"/>
          <path d="M228 298C252 312 260 329 246 344" stroke="#f0ead3" stroke-width="2" stroke-linecap="round"/>
          <path d="M52 382C108 371 135 385 170 399M319 384C350 376 367 363 381 345" stroke="#7f9b6d" stroke-width="2" stroke-linecap="round" opacity=".6"/>

          <!-- Trees frame the scene instead of repeating along a grid. -->
          <g class="home-campus-tree home-campus-tree-left">
            <path d="M65 324C67 289 62 270 62 243M64 282L44 265M64 269L82 252" stroke="#687e5f" stroke-width="5" stroke-linecap="round"/>
            <path d="M37 218C19 211 17 187 34 176C25 155 40 137 59 140C68 122 93 127 96 147C118 150 121 177 106 187C113 206 96 226 77 221C65 235 46 233 37 218Z" fill="#809d70"/>
            <path d="M39 177C47 160 72 152 91 159" stroke="#99b381" stroke-width="10" stroke-linecap="round"/>
            <path d="M68 224C80 228 98 218 101 207" stroke="#69885f" stroke-width="11" stroke-linecap="round"/>
          </g>
          <g class="home-campus-tree home-campus-tree-right">
            <path d="M452 305L453 213M453 250L432 230M453 240L468 221" stroke="#738466" stroke-width="5" stroke-linecap="round"/>
            <path d="M434 218C418 220 406 206 411 191C399 174 409 152 428 150C434 128 464 124 475 145C495 144 511 164 502 181C511 203 489 226 471 219C460 230 443 230 434 218Z" fill="#9caf7e"/>
            <path d="M428 167C439 149 467 148 478 163" stroke="#b4c38e" stroke-width="11" stroke-linecap="round"/>
          </g>
          <g class="home-campus-bench">
            <path d="M80 351L127 361M81 359L128 369" stroke="#b99561" stroke-width="5" stroke-linecap="round"/>
            <path d="M83 364L79 380M121 373L117 387" stroke="#718467" stroke-width="4" stroke-linecap="round"/>
          </g>
        </g>

        <!-- The steps ground the original mascot added above this illustration. -->
        <path d="M102 405C180 383 323 386 404 409L403 430C328 453 180 454 105 431Z" fill="#e5dec4"/>
        <ellipse cx="253" cy="407" rx="151" ry="24" fill="#f5eed9"/>
        <path d="M105 431C184 452 324 451 403 430L418 439C346 467 163 468 90 440Z" fill="#d3cdb3"/>
        <path d="M99 439C177 462 329 460 409 439" stroke="#ece6d0" stroke-width="2" stroke-linecap="round"/>

        <g class="home-campus-grass" fill="#758e61">
          <path d="M65 405L57 390L68 397L71 383L76 405Z"/>
          <path d="M435 418L432 399L440 408L447 393L447 418Z"/>
          <path d="M94 458L91 448L99 452L104 443L104 458Z" opacity=".65"/>
        </g>
        <g class="home-campus-leaf home-campus-leaf-one">
          <path d="M107 94C113 82 126 82 129 78C132 90 123 103 107 94Z" fill="#9aac78"/>
          <path d="M109 94L123 86" stroke="#7c9369" stroke-width="1.2" stroke-linecap="round"/>
        </g>
        <g class="home-campus-leaf home-campus-leaf-two">
          <path d="M433 113C442 105 451 109 457 107C454 120 441 125 433 113Z" fill="#d6b76b"/>
          <path d="M436 113L449 113" stroke="#b79e58" stroke-width="1.2" stroke-linecap="round"/>
        </g>
        <path d="M76 115L81 117M463 251L467 248M408 80L411 76" stroke="#abb992" stroke-width="3" stroke-linecap="round"/>
      </svg>
    </div>`;

  function render(){return scene;}

  root.DormHomeScene={render};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.DormHomeScene;
})(typeof globalThis!=='undefined'?globalThis:this);
