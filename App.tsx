
import { StatusBar } from 'expo-status-bar';
import { Text, View, TouchableOpacity, Dimensions, Pressable, StyleSheet } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';

const ScreenWidth = Dimensions.get('window').width;
const ScreenHeight = Dimensions.get('window').height;
const SHIP_WIDTH = 50;
const SHIP_HEIGHT = 50;
const OZN_WIDTH = 40;
const OZN_HEIGHT = 40;
const BULLET_WIDTH = 5;
const BULLET_HEIGHT = 15;

type Entity = { id: number; x: number; y: number };

export default function App() {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [shipX, setShipX] = useState(ScreenWidth / 2 - SHIP_WIDTH / 2);
  const [projectiles, setProjectiles] = useState<Entity[]>([]);
  const [ozns, setOzns] = useState<Entity[]>([]);

  // Game Loop Ref
  const loopRef = useRef<number>(0);
  const lastOznSpawn = useRef<number>(0);

  // Input handling
  const moveRef = useRef<'left' | 'right' | null>(null);

  useEffect(() => {
    if (gameOver) return;

    const loop = (time: number) => {
      // 1. Move Ship
      if (moveRef.current === 'left') {
        setShipX((x) => Math.max(0, x - 5));
      } else if (moveRef.current === 'right') {
        setShipX((x) => Math.min(ScreenWidth - SHIP_WIDTH, x + 5));
      }

      // 2. Spawn OZNs
      if (time - lastOznSpawn.current > 1500) { // Every 1.5s
        setOzns((prev) => [
          ...prev,
          { id: time, x: Math.random() * (ScreenWidth - OZN_WIDTH), y: -OZN_HEIGHT }
        ]);
        lastOznSpawn.current = time;
      }

      // 3. Update OZNs
      setOzns((prevOzns) => {
        const newOzns = [];
        for (let ozn of prevOzns) {
          const newY = ozn.y + 3; // Speed
          if (newY < ScreenHeight) {
            // Check collision with ship
            if (newY + OZN_HEIGHT > ScreenHeight - 100 &&
              newY < ScreenHeight - 100 + SHIP_HEIGHT &&
              ozn.x < shipX + SHIP_WIDTH &&
              ozn.x + OZN_WIDTH > shipX) {
              setGameOver(true);
            }
            newOzns.push({ ...ozn, y: newY });
          }
        }
        return newOzns;
      });

      // 4. Update Projectiles
      setProjectiles((prevProjs) => {
        const newProjs = [];
        for (let p of prevProjs) {
          const newY = p.y - 10;
          if (newY > -50) newProjs.push({ ...p, y: newY });
        }
        return newProjs;
      });

      loopRef.current = requestAnimationFrame(loop);
    };

    loopRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(loopRef.current);
  }, [gameOver, shipX]);


  // Collision Effect for Bullets hitting Enemies
  useEffect(() => {
    if (gameOver) return;

    let hit = false;
    let scoreAdd = 0;
    let oznsToRemove = new Set();
    let projsToRemove = new Set();

    // Check all pairs
    projectiles.forEach(p => {
      ozns.forEach(o => {
        if (!oznsToRemove.has(o.id) && !projsToRemove.has(p.id)) {
          if (p.x < o.x + OZN_WIDTH &&
            p.x + BULLET_WIDTH > o.x &&
            p.y < o.y + OZN_HEIGHT &&
            p.y + BULLET_HEIGHT > o.y) {
            // Hit
            oznsToRemove.add(o.id);
            projsToRemove.add(p.id);
            scoreAdd += 10;
          }
        }
      });
    });

    if (scoreAdd > 0) {
      setScore(s => s + scoreAdd);
      setOzns(prev => prev.filter(o => !oznsToRemove.has(o.id)));
      setProjectiles(prev => prev.filter(p => !projsToRemove.has(p.id)));
    }

  }, [projectiles, ozns, gameOver]);


  const fire = () => {
    if (gameOver) return;
    setProjectiles(prev => [...prev, { id: Date.now(), x: shipX + SHIP_WIDTH / 2 - BULLET_WIDTH / 2, y: ScreenHeight - 100 }]);
  };

  const restart = () => {
    setScore(0);
    setOzns([]);
    setProjectiles([]);
    setGameOver(false);
    setShipX(ScreenWidth / 2 - SHIP_WIDTH / 2);
    moveRef.current = null;
    lastOznSpawn.current = 0;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HUD */}
      <View style={styles.hud}>
        <Text style={styles.scoreText}>Destroyed: {score / 10}</Text>
      </View>

      {/* Game Area */}
      {!gameOver && (
        <View style={styles.gameArea}>
          {/* Ship */}
          <View
            style={[styles.ship, {
              width: SHIP_WIDTH,
              height: SHIP_HEIGHT,
              left: shipX,
              top: ScreenHeight - 100
            }]}
          >
            <View style={styles.shipCockpit} />
          </View>

          {/* Enemies */}
          {ozns.map(o => (
            <View
              key={o.id}
              style={[styles.ozn, {
                width: OZN_WIDTH,
                height: OZN_HEIGHT,
                left: o.x,
                top: o.y
              }]}
            >
              <View style={styles.oznEyeLeft} />
              <View style={styles.oznEyeRight} />
            </View>
          ))}

          {/* Projectiles */}
          {projectiles.map(p => (
            <View
              key={p.id}
              style={[styles.projectile, {
                width: BULLET_WIDTH,
                height: BULLET_HEIGHT,
                left: p.x,
                top: p.y
              }]}
            />
          ))}
        </View>
      )}

      {/* Controls Overlay */}
      {!gameOver ? (
        <View style={styles.controls}>
          <Pressable
            onPressIn={() => moveRef.current = 'left'}
            onPressOut={() => moveRef.current = null}
            style={({ pressed }) => [styles.controlBtn, pressed && styles.controlBtnActive]}>
            <Text style={styles.controlBtnText}>{"<"}</Text>
          </Pressable>

          <Pressable
            onPress={fire}
            style={({ pressed }) => [styles.fireBtn, pressed && styles.fireBtnActive]}>
            <Text style={styles.fireBtnText}>FIRE</Text>
          </Pressable>

          <Pressable
            onPressIn={() => moveRef.current = 'right'}
            onPressOut={() => moveRef.current = null}
            style={({ pressed }) => [styles.controlBtn, pressed && styles.controlBtnActive]}>
            <Text style={styles.controlBtnText}>{">"}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverText}>GAME OVER</Text>
          <Text style={styles.finalScoreText}>Final Score: {score}</Text>
          <TouchableOpacity onPress={restart} style={styles.restartBtn}>
            <Text style={styles.restartBtnText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  hud: {
    position: 'absolute',
    top: 48,
    left: 20,
    zIndex: 10,
  },
  scoreText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  ship: {
    position: 'absolute',
    backgroundColor: '#3b82f6', // blue-500
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  shipCockpit: {
    position: 'absolute',
    top: 8,
    left: 16,
    width: 16,
    height: 16,
    backgroundColor: '#93c5fd', // blue-300
    borderRadius: 9999,
  },
  ozn: {
    position: 'absolute',
    backgroundColor: '#22c55e', // green-500
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: '#86efac', // green-300
  },
  oznEyeLeft: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 8,
    height: 8,
    backgroundColor: '#ef4444', // red-500
    borderRadius: 9999,
  },
  oznEyeRight: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: '#ef4444', // red-500
    borderRadius: 9999,
  },
  projectile: {
    position: 'absolute',
    backgroundColor: '#facc15', // yellow-400
    borderRadius: 9999,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    height: 96,
    alignItems: 'center',
  },
  controlBtn: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(31, 41, 55, 0.8)', // gray-800/80
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4b5563', // gray-600
  },
  controlBtnActive: {
    backgroundColor: '#374151', // gray-700
  },
  controlBtnText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
  fireBtn: {
    width: 96,
    height: 96,
    backgroundColor: 'rgba(220, 38, 38, 0.8)', // red-600/80
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
    borderWidth: 4,
    borderColor: '#ef4444', // red-500
  },
  fireBtnActive: {
    backgroundColor: '#b91c1c', // red-700
  },
  fireBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
  gameOverContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  gameOverText: {
    color: '#ef4444', // red-500
    fontSize: 60,
    fontWeight: '800', // extrabold
    marginBottom: 32,
    letterSpacing: -1,
    // shadow removed as it's not standard in StyleSheet exactly like web, but elevation works on android
    textShadowColor: 'rgba(239, 68, 68, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  finalScoreText: {
    color: 'white',
    fontSize: 24,
    marginBottom: 32,
  },
  restartBtn: {
    backgroundColor: '#2563eb', // blue-600
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: '#60a5fa', // blue-400
  },
  restartBtnText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
