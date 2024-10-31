```markdown
# Pose Detection with MoveNet in Angular

This project demonstrates real-time pose detection using [TensorFlow.js](https://www.tensorflow.org/js) and the [MoveNet](https://www.tensorflow.org/lite/models/pose_estimation/overview) model in an Angular app. It utilizes a webcam feed to detect human poses and displays a skeleton overlay on the detected keypoints.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
- [Usage](#usage)
- [File Structure](#file-structure)
- [Adding a New Page, Module, and Component](#adding-a-new-page-module-and-component)
- [Adding Nested Routing Inside a Page](#adding-nested-routing-inside-a-page)
- [License](#license)

## Features

- Real-time pose detection with a skeleton overlay
- Option to start and stop the webcam feed
- Toggle pose detection on/off
- Error handling for webcam access issues

## Technologies Used

- Angular
- TensorFlow.js
- MoveNet Model (for pose detection)
- TypeScript
- HTML/CSS

## Getting Started

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/wantanwonderland/pose-detection-angular.git
    cd pose-detection-angular
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

### Running the App

1. Start the Angular development server:

    ```bash
    ng serve
    ```

2. Open your browser and navigate to `http://localhost:4200`.

## Usage

- **Start Camera**: Click the "Start Camera" button to initiate the webcam.
- **Toggle Detection**: Use the checkbox to start or stop real-time pose detection.
- **Stop Camera**: Click "Stop Camera" to stop the webcam feed and detection.

## File Structure

```plaintext
pose-detection-angular/
├── src/
│   ├── app/
│   │   ├── pages/
│   │   │   ├── pose-detection/
│   │   │   │   ├── pose-detection.component.ts     # Pose detection component logic
│   │   │   │   ├── pose-detection.component.html   # Pose detection UI structure
│   │   │   │   ├── pose-detection.component.scss   # Pose detection styles
│   │   │   │   ├── details/                        # Example of nested page component
│   ├── assets/                                     # Static assets
│   ├── environments/                               # Environment configurations
├── angular.json
├── package.json
└── README.md
```

## Adding a New Page, Module, and Component

To add a new page to the app, follow these steps:

1. **Generate a New Module**: Create the module inside the `pages` folder.

    ```bash
    ng generate module pages/page-name
    ```

    Replace `page-name` with the desired name of the new page.

2. **Generate a New Component**: Create a component within the new module.

    ```bash
    ng generate component pages/page-name
    ```

    Replace `page-name` with the name of the new page. This will create a folder with `.ts`, `.html`, and `.scss` files for the component.

3. **Add Route in `AppRoutingModule`**: Open `app-routing.module.ts` and add a new route for the page:

    ```typescript
    import { NgModule } from '@angular/core';
    import { RouterModule, Routes } from '@angular/router';

    const routes: Routes = [
      {
        path: 'home',
        loadChildren: () => import('./pages/pose-detection/pose-detection.module').then(m => m.PoseDetectionModule),
      },
      {
        path: 'page-name',  // The path for the new page
        loadChildren: () => import('./pages/page-name/page-name.module').then(m => m.PageNameModule),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
    ];

    @NgModule({
      imports: [RouterModule.forRoot(routes)],
      exports: [RouterModule]
    })
    export class AppRoutingModule { }
    ```

    Replace `page-name` with the actual path and module name. This lazy-loads the module for better performance.

## Adding Nested Routing Inside a Page

To add nested routes within a page, for example, to display additional views in `PoseDetectionModule`, follow these steps:

1. **Create a New Component for the Nested Page**:

    ```bash
    ng generate component pages/pose-detection/details
    ```

    This will create a `details` component inside the `pose-detection` module.

2. **Add Routes in `PoseDetectionModule`**:

    Open `pose-detection.module.ts` and update the routes to include the nested route.

    ```typescript
    import { NgModule } from '@angular/core';
    import { CommonModule } from '@angular/common';
    import { PoseDetectionComponent } from './pose-detection.component';
    import { DetailsComponent } from './details/details.component';
    import { RouterModule, Routes } from '@angular/router';
    import { FormsModule } from '@angular/forms';

    const routes: Routes = [
      {
        path: '',
        component: PoseDetectionComponent,
        children: [
          {
            path: 'details',
            component: DetailsComponent,
          }
        ]
      }
    ];

    @NgModule({
      declarations: [
        PoseDetectionComponent,
        DetailsComponent
      ],
      imports: [
        CommonModule,
        RouterModule.forChild(routes),
        FormsModule,
      ]
    })
    export class PoseDetectionModule { }
    ```

3. **Access the Nested Route**:

    Now you can navigate to `/home/details` to display the `DetailsComponent` as a nested route under the `PoseDetectionComponent`.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
```
