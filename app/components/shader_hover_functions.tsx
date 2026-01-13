export const hoverFunctions = {
  applyHover: () => `
        vec4 applyHover(
          vec4 baseColor,
          vec2 fragCoord,
          float cellSize,
          vec2 cellTopLeft,
          float blockSize,
          vec2 cellUv,
          vec3 hoverColor
        ) {
          if (hoverActive < 0.5 && hoverTrailActive == 0) {
            return baseColor;
          }

          vec2 hoverPixel = vec2(hoverPos.x * resolution.x, hoverPos.y * resolution.y);
          float hoverRow = floor(hoverPixel.y / cellSize);
          float hoverCol = floor(hoverPixel.x / cellSize);
          float hoverRowCoord = hoverPixel.y / cellSize;
          float hoverColCoord = hoverPixel.x / cellSize;

          float currentRow = floor(fragCoord.y / cellSize);
          float currentCol = floor(fragCoord.x / cellSize);
          float currentRowCoord = fragCoord.y / cellSize;
          float currentColCoord = fragCoord.x / cellSize;

          vec4 sampledIcon = texture2D(xTexture, clamp((fragCoord - cellTopLeft) / blockSize, 0.0, 1.0));
          vec3 iconColor = mix(vec3(1.0),lightColor.rgb, sampledIcon.a);
          vec3 iconColor2 = mix(hoverColor.rgb, darkColor.rgb, sampledIcon.a);

          // Central color options
          vec4 hoverCenterWithWhiteResult = vec4(computeCellFillColor(cellUv, baseColor.rgb,hoverColor.rgb), 1.0);
          vec4 darkColorCenterResult = vec4(computeCellFillColor(cellUv, hoverColor.rgb, darkColor.rgb), 1.0);
          vec4 lightColorCenterResult = vec4(computeCellFillColor(cellUv, hoverColor.rgb, lightColor.rgb), 1.0);
          vec4 baseResult = vec4(hoverColor.rgb, 1.0);
          vec4 borderSquare = vec4(computeCellFillColor(cellUv, hoverColor.rgb, baseColor.rgb), 1.0);
          vec4 iconSquare = vec4(iconColor, 1.0);
          vec4 iconSquare2 = vec4(iconColor2, 1.0);

          float selector;
          // Use integer cell position for deterministic noise
          float prngSeed = mod(currentRow * 73.0 + currentCol * 37.0, 100.0) / 100.0;
          selector = prngSeed;

            // Расстояние до курсора
            float rowDistance = abs(currentRow - hoverRow);
            float colDistance = abs(currentCol - hoverCol);

          for (int i = 0; i < trailMax; i++) {
            if (i >= hoverTrailActive) {
              break;
            }

            // Проверяем, что клетка находится через 5-8 рядов от курсора
            // Время задержки исчезновения (в секундах) - клетка остается закрашенной после активации
            float fadeDuration = 0.8;
            // Стабильный seed для клетки (не зависит от времени для предотвращения мигания)
            float cellSeed = currentRow * 97.0 + currentCol * 41.0;
            float cellRandomValue = random(cellSeed);
            
            // Проверяем условие расстояния (основная зона активации)
            bool inDistanceRange = (rowDistance > 5.0 && rowDistance <= 8.0 && colDistance <= 9.0) || 
                                   (colDistance > 5.0 && colDistance <= 9.0 && rowDistance <= 9.0);
            
            // Расширенная зона для плавного fade-out (предотвращает мигание при быстром движении мыши)
            float fadeRadius = 2.5;
            bool inExtendedRange = (rowDistance > (5.0 - fadeRadius) && rowDistance <= (8.0 + fadeRadius) && colDistance <= (9.0 + fadeRadius)) || 
                                   (colDistance > (5.0 - fadeRadius) && colDistance <= (9.0 + fadeRadius) && rowDistance <= (9.0 + fadeRadius));
            
            // Используем временные сегменты для создания "памяти" - клетка остается закрашенной
            // в течение fadeDuration после активации, даже если курсор ушел
            float timeSegment = floor(time / fadeDuration);
            // Уникальный ID для каждой клетки в текущем временном сегменте
            float segmentId = mod(cellSeed + timeSegment * 23.0, 1000.0) / 1000.0;
            // Клетка была активирована в текущем сегменте, если:
            // 1. Ее случайность < threshold (та же логика, что и для активации)
            // 2. И ее ID попадает в диапазон активации для данного сегмента
            bool wasActivated = (segmentId < 0.01) && (cellRandomValue < 0.01);
            
            // Клетка закрашивается, если:
            // 1. Находится в расширенной зоне И случайность < threshold (текущая активация)
            // 2. ИЛИ была активирована в текущем временном сегменте (память для предотвращения мигания)
            bool shouldFill = (inExtendedRange && cellRandomValue < 0.05) || wasActivated;
            
            if (shouldFill) {
              // Вычисляем расстояние от границы основной зоны для плавного fade-out
              float distFromMainZone = 0.0;
              if (inDistanceRange) {
                // В основной зоне - полная яркость
                distFromMainZone = 0.0;
              } else if (inExtendedRange) {
                // В расширенной зоне - вычисляем расстояние до границы основной зоны
                float minRowDist = min(abs(rowDistance - 5.0), abs(rowDistance - 8.0));
                float minColDist = min(abs(colDistance - 5.0), abs(colDistance - 9.0));
                distFromMainZone = min(minRowDist, minColDist);
              } else {
                // Вне зоны, но была активирована - используем время для fade-out
                float segmentProgress = mod(time, fadeDuration) / fadeDuration;
                distFromMainZone = fadeRadius * segmentProgress;
              }
              
              // Плавный fade-out при удалении от основной зоны или со временем
              float fadeFactor = 1.0 - smoothstep(0.0, fadeRadius, distFromMainZone);
              vec4 fadedResult = mix(baseColor, baseResult, fadeFactor);
              return fadedResult;
            }


            vec2 trailCell = hoverTrailPos[i];
            float age = clamp(hoverTrailAge[i], 0.0, 1.0);
            
            // Радиус плавно сужается от начала хвоста (полный) к концу (узкий)
            // age = 0.0 (новый trail) -> полный радиус hoverRadius
            // age = 1.0 (старый trail) -> узкий радиус hoverRadius * 0.2
            // Используем квадратичную кривую для более заметного сужения к концу
            float ageFactor = age * age;
            float trailRadius = mix(hoverRadius, hoverRadius * 0.2, ageFactor);
            
            // Расширенная зона для fade-out - очень маленькая, чтобы сужение было заметным
            float trailFadeRadius = mix(0.3, 0.1, ageFactor);
            
            float distToTrailRow = abs(currentRow - trailCell.y);
            float distToTrailCol = abs(currentCol - trailCell.x);
            
            // Используем проверку по ОБЕИМ координатам (И), чтобы создать узкую форму
            // Это создает более узкий хвост, особенно для старых элементов
            float extendedTrailRadius = trailRadius + trailFadeRadius;
            bool inExtendedTrailZone = distToTrailRow < extendedTrailRadius && 
                                       distToTrailCol < extendedTrailRadius;
            
            if (inExtendedTrailZone) {
              // Основная зона trail (динамический радиус, зависит от возраста)
              bool inTrailZone = distToTrailRow < trailRadius && distToTrailCol < trailRadius;
              
              // Вычисляем расстояние для fade (используем максимальное расстояние)
              float distToTrail = max(distToTrailRow, distToTrailCol);
              // Используем стабильные координаты ячейки вместо trailCell для предотвращения мерцания
              float bias = mod(currentRow + currentCol + float(i), 4.0) * 0.2;
              float threshold = 0.5 + bias;
              bool nearHover =
                abs(currentRowCoord - hoverRowCoord) <= hoverRadius &&
                abs(currentColCoord - hoverColCoord) <= hoverRadius;
              float iconFactor = nearHover ? 0.0 : (age < threshold ? 0.0 : 1.0);
              // Используем стабильные координаты ячейки для squareVariant
              float squareVariant = mod(currentRow + currentCol + float(i), 3.0);
              float rndSeed = currentRow * 73.0 + currentCol * 37.0 + float(i) * 17.0;
              float rnd = random(rndSeed);
              vec4 squareChoice;
              if (rnd < 0.8) {
                squareChoice = baseResult;
              }  else if (rnd < 0.85) {
                squareChoice = hoverCenterWithWhiteResult;
              } else if (rnd < 0.9) {
                squareChoice = iconSquare2;
              } else if (rnd < 0.95) {
                squareChoice = iconSquare;
              } else if (rnd < 0.98) {
                squareChoice = borderSquare;
              } else {
                squareChoice = darkColorCenterResult;
              }
              
              // Вычисляем fade factor на основе:
              // 1. Расстояния от основной зоны (плавный переход при выходе)
              // 2. Возраста trail (старые trail исчезают)
              float distFromTrailZone = 0.0;
              if (inTrailZone) {
                // В основной зоне - расстояние 0
                distFromTrailZone = 0.0;
              } else {
                // В расширенной зоне - вычисляем расстояние до границы основной зоны
                // Используем максимальное расстояние для более точного fade
                float distRow = max(0.0, distToTrailRow - trailRadius);
                float distCol = max(0.0, distToTrailCol - trailRadius);
                distFromTrailZone = max(distRow, distCol);
              }
              
              // Fade на основе расстояния от основной зоны
              float distanceFade = 2.0 - smoothstep(0.0, trailFadeRadius, distFromTrailZone);
              
              // Fade на основе возраста trail (старые trail постепенно исчезают)
              // age = 0.0 (новый) -> 1.0 (старый), применяем fade начиная с 0.7
              float ageFade = 1.0 - smoothstep(0.7, 1.0, age);
              
              // Комбинируем оба fade фактора
              float totalFadeFactor = min(distanceFade, ageFade);
              
              // Применяем fade к выбранному цвету
              vec4 fadedChoice = mix(baseColor, squareChoice, totalFadeFactor);
              return fadedChoice;
            }
          }

          return baseColor;
        }   
    `,
  applyWhiteHover: () => `
        vec4 applyWhiteHover(
          vec4 baseColor,
          vec2 fragCoord,
          float cellSize,
          vec2 cellTopLeft,
          float blockSize,
          vec2 cellUv,
          vec3 hoverColor
        ) {
          if (hoverActive < 0.5 && hoverTrailActive == 0) {
            return baseColor;
          }

          vec2 hoverPixel = vec2(hoverPos.x * resolution.x, hoverPos.y * resolution.y);
          float hoverRow = floor(hoverPixel.y / cellSize);
          float hoverCol = floor(hoverPixel.x / cellSize);
          float hoverRowCoord = hoverPixel.y / cellSize;
          float hoverColCoord = hoverPixel.x / cellSize;

          float currentRow = floor(fragCoord.y / cellSize);
          float currentCol = floor(fragCoord.x / cellSize);
          float currentRowCoord = fragCoord.y / cellSize;
          float currentColCoord = fragCoord.x / cellSize;

          vec4 result = vec4(computeCellFillColor(cellUv, white.rgb, hoverColor.rgb), 1.0);
          vec4 darkColorResult = vec4(computeCellFillColor(cellUv, white.rgb, hoverColor.rgb), 1.0);

          if (hoverActive > 0.5 &&
              abs(currentRowCoord - hoverRowCoord) <= hoverRadius &&
              abs(currentColCoord - hoverColCoord) <= hoverRadius) {
              return result;
            }

          for (int i = 0; i < trailMax/4; i++) {
            if (i >= hoverTrailActive) {
              break;
            }
            vec2 trailCell = hoverTrailPos[i];
            if (
              abs(currentRow - trailCell.y) < 0.5 &&
              abs(currentCol - trailCell.x) < 0.5
            ) {
              float age = clamp(hoverTrailAge[i], 0.0, 1.0);
              float bias = mod(trailCell.x + trailCell.y + float(i), 4.0) * 0.2;
              float threshold = 0.05 + bias;
              bool nearHover =
                abs(currentRow - hoverRow) <= 0.5 &&
                abs(currentCol - hoverCol) <= 0.5;
              float iconFactor = nearHover ? 0.0 : (age < threshold ? 0.0 : 1.0);
              if (iconFactor >= 1.0) {
                return darkColorResult;
              }
              return result;
            }
          }

          return baseColor;
        }   
    `
}