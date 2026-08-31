# Compatibility with Mission Hints

Our feature relies on the mission title to find out what the requirements will be based on our list. 
Tools that modify the title result in us not being able to find those requirements.

## Solution

Starting with 'TornTools v9.2.0' (extension) and 'TornTools: Mission Hints v1.1.0' (userscript), 
we will be supporting a specific attribute on the mission in the DOM. Place 'data-original-title' on the 'div' element with the mission id. 
We'll use that attribute when present over the title being shown the user.

```html
<div id="mission1" 
     class="tab-cont-wrap missions-bg-8 tt-modified ui-tabs-panel ui-widget-content ui-corner-bottom"
     data-original-title="Inside Job" <-- add this attribute
     ...
>
    <div class="title-black hospital-dark top-round">
        Inside Job
        <...>
    </div>
    <div class="tab-cont scroll-area scrollbar-transparent">
        <div class="max-height-fix info">
            <...>
        </div>
        <div class="task-delimiter"></div>
        <div class="tasks-wrap contract">
            <...>
        </div>
    </div>
</div>
```