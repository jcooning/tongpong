import mascot1x from '../assets/mascot.webp'
import mascot2x from '../assets/mascot@2x.webp'
import mascot3x from '../assets/mascot@3x.webp'
import './MascotScene.css'

export default function MascotScene() {
  return (
    <div className="scene">
      <div className="scene-inner">
        <img
          className="mascot-img"
          src={mascot1x}
          srcSet={`${mascot1x} 1x, ${mascot2x} 2x, ${mascot3x} 3x`}
          alt="통통이와 퐁퐁이"
          draggable={false}
        />
      </div>
    </div>
  )
}
