import React from 'react'
import Anim from './Anim.js'
export default class App extends React.PureComponent {
	static defaultProsp = {}
	constructor(props) {
		super(props)
		this.state = {
			x: 0
		}
	}
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
	}
	handleClick = () => {
		let move = Anim.init(0.5, (p) => {
			this.setState({
				x: Anim.motion(0, 100, p)
			})
		})
		move.easing = Anim.ease.spring
		move.delay = 10
		move.yoyo = true
		move.replay = 10
		move.play()
	}
}

		//Anim.init(time, (p)=>{})
		//p is 0~1 value
