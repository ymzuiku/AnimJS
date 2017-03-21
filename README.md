# AnimJS
Animation of all Javascript frame

Use bezier-easing: https://github.com/gre/bezier-easing

![Gif](./anim.gif)

## Use Anim.js in React or ReactNative
### 1.Download Anim.js, and import
```
import Anim from './Anim.js'
```

### 2.Bind this.state value
```
render() {
	return (
		<div style={{
			transform: `translateX(${this.state.x}px)`,
			width: 200,
			height: 200,
			backgroundColor: '#f00',
			color: '#fff',
		}}
			onClick={this.handleClick}
		>
			Touch Me!
		</div>
	)
	handleClick = ()=>{}
}
```
### 3.Use Anim.js change this.state.x
```
handleClick = () => {
	let move = Anim.init(0.5, (p) => {
		this.setState({
			x: Anim.motion(0, 100, p)
		})
	})
	move.play()
}
```

## API List

### Anim.init()
> Anim.init(time, function)
```
let an = Anim.init(0.3, (value)=>{console.log(value)})
an.play(()=>{console.log('animation is end)})
```
value is 0~1 in 0.3 second

### Anim.motion()
> Anim.motion(startValue, endValue, value)
```
let an = Anim.init(0.3, (value)=>{
	let per = Anim.motion(50, 150, value)
	console.log(per)
})
an.play()
```

### Anim.ease
```
let an = Anim.init(0.3, (value)=>{
	let per = Anim.motion(50, 150, value)
	console.log(per)
})
an.easing = Anim.ease.spring
//or
an.easing = [0.25, 0.5, 0.7, 1]
an.play()
```

### delay, yoyo, replay, play, stop
```
an.delay = 10
an.yoyo = true
an.replay = 10
an.play()
```

### play(callback()), stop()
```
an.play(()=>{console.log('animation is end)})
an.stop()
```
