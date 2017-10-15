const fs = require('fs')

class ProjectParser {
  constructor({inputPath, outputPath, reducer}) {
    this.reducer = reducer
    this.inputPath = inputPath
    this.outputPath = outputPath
  }

  parse() {
    let input = fs.readFileSync(this.inputPath)
    let output = fs.openSync(this.outputPath, 'w')

    let lines = input.toString().split('\n')
    let offset = 0
    lines.forEach(line => {
      let outLine = line
      if (line && line.startsWith('-')) {
        outLine = this.reducer(line)
      }
      if (outLine || outLine === '') {
        offset += fs.writeSync(output, outLine, offset, 'utf8')
        offset += fs.writeSync(output, '\n', offset, 'utf8')
      }
    })

    fs.closeSync(output)
  }
}

module.exports = ProjectParser

/* 
console.log("START!")
try {
const config = require('./config')
const path = require('path')
let parser = new ProjectParser({
  inputPath: path.resolve(config.projectPath, config.projectName),
  outputPath: './out.md',
  reducer: (line) => {
    console.log(line.toString())

    return line
  }
})

parser.parse()

}
catch (e) {
  console.error(e)
}
*/