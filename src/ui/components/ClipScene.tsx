import { Canvas } from '@react-three/fiber'
import { Environment, Float, OrbitControls } from '@react-three/drei'
import type { GameState } from '../../domain/game'

interface ClipSceneProps {
  state: GameState
}

export function ClipScene({ state }: ClipSceneProps) {
  const clipCount = Math.max(3, Math.min(24, Math.round(state.production.clips / 10) + 3))

  return (
    <Canvas camera={{ position: [0, 2.2, 6], fov: 45 }}>
      <color attach="background" args={['#020617']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 4]} intensity={2.2} color="#67e8f9" />
      <directionalLight position={[-4, -3, -4]} intensity={0.6} color="#a78bfa" />
      <Environment preset="city" />
      <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.8}>
        <group>
          <mesh rotation={[0.4, 0.2, 0]}>
            <torusGeometry args={[1.15, 0.22, 18, 48]} />
            <meshStandardMaterial color="#38bdf8" metalness={0.7} roughness={0.2} />
          </mesh>
          <mesh position={[0, -1.3, 0]}>
            <cylinderGeometry args={[0.55, 0.75, 0.4, 24]} />
            <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.5} />
          </mesh>
          {Array.from({ length: clipCount }).map((_, index) => {
            const angle = (index / clipCount) * Math.PI * 2
            const radius = 2.35 + (index % 3) * 0.06

            return (
              <mesh
                key={index}
                position={[Math.cos(angle) * radius, Math.sin(index * 0.7) * 0.4, Math.sin(angle) * radius]}
                rotation={[angle, angle * 0.5, angle * 0.15]}
              >
                <boxGeometry args={[0.08, 0.45, 0.18]} />
                <meshStandardMaterial color={index % 2 === 0 ? '#e2e8f0' : '#cbd5e1'} metalness={0.95} roughness={0.15} />
              </mesh>
            )
          })}
        </group>
      </Float>
      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.7} />
    </Canvas>
  )
}
