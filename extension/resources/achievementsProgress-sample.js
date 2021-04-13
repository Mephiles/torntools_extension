/*
I found this gem and figured if we are going to keep the achievements' hover progress design same/similar then we could upgrade it.

URL: https://codepen.io/peruvianidol/pen/NLMvqO
CODE: BELOW
*/

//
// HTML
//
// This includes multiple designs that can be checked out at the URL
// The first 3 represent the basic action which would fit here well

/*
<section>
  <h2>Default</h2>

  <ol class="progress-bar">
    <li class="is-active"><span>Objective &amp; Template</span></li>  
    <li><span>Options</span></li>  
    <li><span>Step</span></li>
    <li><span>In a Nutshell</span></li>  
    <li><span>Step</span></li>
    <li><span>Step</span></li>
    <li><span>Launch Date</span></li>  
    <li><span>Step</span></li>
    <li><span>Step</span></li>
    <li><span>Agreement</span></li>  
  </ol>
</section>

<section>
  <h2>Step 2</h2>

  <ol class="progress-bar">
    <li class="is-complete"><span>Objective &amp; Template</span></li>  
    <li class="is-active"><span>Options</span></li>  
    <li><span>Step</span></li>
    <li><span>In a Nutshell</span></li>  
    <li><span>Step</span></li>
    <li><span>Step</span></li>
    <li><span>Launch Date</span></li>  
    <li><span>Step</span></li>
    <li><span>Step</span></li>
    <li><span>Agreement</span></li>  
  </ol>
</section>

<section>
  <h2>Multiple Steps Complete</h2>

  <ol class="progress-bar">
    <li class="is-complete"><span>Objective &amp; Template</span></li>  
    <li class="is-complete"><span>Options</span></li>  
    <li class="is-complete"><span>Step</span></li>
    <li class="is-complete"><span>In a Nutshell</span></li>  
    <li class="is-complete"><span>Step</span></li>
    <li class="is-complete"><span>Step</span></li>
    <li class="is-active"><span>Launch Date</span></li>  
    <li><span>Step</span></li>
    <li><span>Step</span></li>
    <li><span>Agreement</span></li>  
  </ol>
</section>

<section>
  <h2>Hover</h2>

  <ol class="progress-bar">
    <li class="is-complete"><span>Objective &amp; Template</span></li>  
    <li class="is-complete"><span>Options</span></li>  
    <li class="is-complete"><span>Step</span></li>
    <li class="is-complete is-hovered"><span>In a Nutshell</span></li>  
    <li class="is-complete"><span>Step</span></li>
    <li class="is-complete"><span>Step</span></li>
    <li class="is-complete"><span>Launch Date</span></li>  
    <li><span>Step</span></li>
    <li><span>Step</span></li>
    <li><span>Agreement</span></li>  
  </ol>
</section>

<section>
  <h2>Back From Visited Steps</h2>

  <ol class="progress-bar">
    <li class="is-complete"><span>Objective &amp; Template</span></li>  
    <li class="is-complete"><span>Options</span></li>  
    <li class="is-complete"><span>Step</span></li>
    <li class="is-complete is-active"><span>In a Nutshell</span></li>  
    <li class="is-complete"><span>Step</span></li>
    <li class="is-complete"><span>Step</span></li>
    <li class="is-complete"><span>Launch Date</span></li>  
    <li><span>Step</span></li>
    <li><span>Step</span></li>
    <li><span>Agreement</span></li>  
  </ol>
</section>

<section>
  <h2>Last Step</h2>

  <ol class="progress-bar">
    <li class="is-complete"><span>Objective &amp; Template</span></li>  
    <li class="is-complete"><span>Options</span></li>  
    <li class="is-complete"><span>Step</span></li>
    <li class="is-complete"><span>In a Nutshell</span></li>  
    <li class="is-complete"><span>Step</span></li>
    <li class="is-complete"><span>Step</span></li>
    <li class="is-complete"><span>Launch Date</span></li>  
    <li class="is-complete"><span>Step</span></li>
    <li class="is-complete"><span>Step</span></li>
    <li class="is-active"><span>Agreement</span></li>  
  </ol>
</section>

<section>
  <h2>Progress Bar with Changes Indicator</h2>

  <ol class="progress-bar">
    <li class="is-complete"><span>Objective &amp; Template</span></li>  
    <li class="is-complete"><span>Options</span><span class="has-changes"></span></li>  
    <li class="is-complete"><span>Step</span><span class="has-changes"></span></li>
    <li class="is-complete"><span>In a Nutshell</span></li>  
    <li class="is-complete"><span>Step</span><span class="has-changes"></span></li>
    <li class="is-complete"><span>Step</span></li>
    <li class="is-complete"><span>Launch Date</span></li>  
    <li class="is-complete"><span>Step</span></li>
    <li class="is-complete"><span>Step</span></li>
    <li class="is-active"><span>Agreement</span></li>  
  </ol>
</section>

<section class="x-ray">
  <h2>X-RAY</h2>

  <ol class="progress-bar">
    <li class="is-complete"><span>Objective &amp; Template</span></li>  
    <li class="is-complete"><span>Options</span></li>  
    <li class="is-complete"><span>Step</span></li>
    <li class="is-complete"><span>In a Nutshell</span></li>  
    <li class="is-complete"><span>Step</span></li>
    <li class="is-complete"><span>Step</span></li>
    <li class="is-active"><span>Launch Date</span></li>  
    <li><span>Step</span></li>
    <li><span>Step</span></li>
    <li><span>Agreement</span></li>  
  </ol>
</section>

<section>
  <h2>Issues</h2>
  
  <ul>
    <li>Labels can lose centering when there are many options or the viewport is too narrow to accomodate the required width</li>
  </ul>
  
</section>
*/

///
// CSS
//
// By default other steps of the progress are hidden. For our purpose they could be shown by removing the following block:
// .progress-bar li:not(.is-active) span {
//     opacity: 0;
// }

/*
:root {
  --color-white: #fff;
  --color-black: #333;
  --color-gray: #75787b;
  --color-gray-light: #bbb;
  --color-gray-disabled: #e8e8e8;
  --color-green: #53a318;
  --color-green-dark: #383;
  --font-size-small: .75rem;
  --font-size-default: .875rem;
}

* {
  box-sizing: border-box;
}

body {
  margin: 2rem;
  font-family: 'Open Sans', sans-serif;
  color: var(--color-black);
}

h2 {
  color: var(--color-gray);
  font-size: var(--font-size-small);
  line-height: 1.5;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 3px;
}
section {
  margin-bottom: 2rem;
}

.progress-bar {
  display: flex;
  justify-content: space-between;
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
}
.progress-bar li {
  flex: 2;
  position: relative;
  padding: 0 0 14px 0;
  font-size: var(--font-size-default);
  line-height: 1.5;
  color: var(--color-green);
  font-weight: 600;
  white-space: nowrap;
  overflow: visible;
  min-width: 0;
  text-align: center;
  border-bottom: 2px solid var(--color-gray-disabled);
}
.progress-bar li:first-child,
.progress-bar li:last-child {
  flex: 1;
}
.progress-bar li:last-child {
  text-align: right;
}
.progress-bar li:before {
  content: "";
  display: block;
  width: 8px;
  height: 8px;
  background-color: var(--color-gray-disabled);
  border-radius: 50%;
  border: 2px solid var(--color-white);
  position: absolute;
  left: calc(50% - 6px);
  bottom: -7px;
  z-index: 3;
  transition: all .2s ease-in-out;
}
.progress-bar li:first-child:before {
  left: 0;
}
.progress-bar li:last-child:before {
  right: 0;
  left: auto;
}
.progress-bar span {
  transition: opacity .3s ease-in-out;
}
.progress-bar li:not(.is-active) span {
  opacity: 0;
}
.progress-bar .is-complete:not(:first-child):after,
.progress-bar .is-active:not(:first-child):after {
  content: "";
  display: block;
  width: 100%;
  position: absolute;
  bottom: -2px;
  left: -50%;
  z-index: 2;
  border-bottom: 2px solid var(--color-green);
}
.progress-bar li:last-child span {
  width: 200%;
  display: inline-block;
  position: absolute;
  left: -100%;
}

.progress-bar .is-complete:last-child:after,
.progress-bar .is-active:last-child:after {
  width: 200%;
  left: -100%;
}

.progress-bar .is-complete:before {
  background-color: var(--color-green);
}

.progress-bar .is-active:before,
.progress-bar li:hover:before,
.progress-bar .is-hovered:before {
  background-color: var(--color-white);
  border-color: var(--color-green);
}
.progress-bar li:hover:before,
.progress-bar .is-hovered:before {
  transform: scale(1.33);
}

.progress-bar li:hover span,
.progress-bar li.is-hovered span {
  opacity: 1;
}

.progress-bar:hover li:not(:hover) span {
  opacity: 0;
}

.x-ray .progress-bar,
.x-ray .progress-bar li {
  border: 1px dashed red;
}

.progress-bar .has-changes {
  opacity: 1 !important;
}
.progress-bar .has-changes:before {
  content: "";
  display: block;
  width: 8px;
  height: 8px;
  position: absolute;
  left: calc(50% - 4px);
  bottom: -20px;
  background-image: url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%208%208%22%3E%3Cpath%20fill%3D%22%23ed1c24%22%20d%3D%22M4%200l4%208H0z%22%2F%3E%3C%2Fsvg%3E');
}
*/
