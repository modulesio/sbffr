class Sbffr {
  constructor(size, count, shapes) {
    this.size = size;
    this.count = count;
    this.shapes = shapes;

    const buffer = new Uint8Array(size * count);
    this.buffer = buffer;

    let shapeSizeTotal = 0;
    for (let i = 0; i < shapes.length; i++) {
      shapeSizeTotal += shapes[i].size;
    }
    this.shapeSizeTotal = shapeSizeTotal;

    const shapeSlices = {};
    let byteOffset = 0;
    for (let i = 0; i < shapes.length; i++) {
      const {name, constructor, size} = shapes[i];

      let numBytes = Math.floor((buffer.byteLength * size) / shapeSizeTotal);
      numBytes -= numBytes % constructor.BYTES_PER_ELEMENT;
      const numElements = numBytes / constructor.BYTES_PER_ELEMENT;
      shapeSlices[name] = new constructor(buffer.buffer, buffer.byteOffset + byteOffset, numElements);
      byteOffset += numBytes;
    }
    this.shapeSlices = shapeSlices;

    const freeList = Array(count);
    for (let i = 0; i < freeList.length; i++) {
      freeList[i] = i;
    }
    this.freeList = freeList;
    this.freeListStart = 0;
    this.freeListEnd = 0;
  }

  getAll() {
    return this.shapeSlices;
  }

  alloc() {
    const nextFreeList = (this.freeListStart + 1) % this.count;
    if (nextFreeList !== this.freeListEnd) {
      const index = this.freeList[this.freeListStart];
      this.freeListStart = nextFreeList;

      const result = {
        index,
        slices: {},
      };
      for (let i = 0; i < this.shapes.length; i++) {
        const shape = this.shapes[i];
        const shapeSlice = this.shapeSlices[shape.name];

        const numElementsPerSubSlice = Math.floor(shapeSlice.length / this.count);
        result.slices[shape.name] = shapeSlice.subarray(index * numElementsPerSubSlice, (index + 1) * numElementsPerSubSlice);
      }
      return result;
    } else {
      return null;
    }
  }

  free(buffer) {
    this.freeList[this.freeListEnd] = buffer.index;
    this.freeListEnd = (this.freeListEnd + 1) % this.count;
  }
}

const sbffr = (size, count, shapes) => new Sbffr(size, count, shapes);
module.exports = sbffr;