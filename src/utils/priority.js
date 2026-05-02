const TYPE_WEIGHT = {
    Placement: 3,
    Result: 2,
    Event: 1,
  };
  
  function getScore(notification) {
    const weight = TYPE_WEIGHT[notification.Type] || 0;
    const time = new Date(notification.Timestamp.replace(" ", "T")).getTime();
    return weight * 1e12 + time;
  }
  class MinHeap {
    constructor() {
      this.heap = [];
    }
  
    push(item) {
      this.heap.push(item);
      this.bubbleUp();
    }
  
    pop() {
      if (this.heap.length === 1) return this.heap.pop();
      const top = this.heap[0];
      this.heap[0] = this.heap.pop();
      this.bubbleDown();
      return top;
    }
  
    peek() {
      return this.heap[0];
    }
  
    size() {
      return this.heap.length;
    }
  
    bubbleUp() {
      let index = this.heap.length - 1;
      while (
        index > 0 &&
        this.heap[index].score < this.heap[Math.floor((index - 1) / 2)].score
      ) {
        [this.heap[index], this.heap[Math.floor((index - 1) / 2)]] =
          [this.heap[Math.floor((index - 1) / 2)], this.heap[index]];
        index = Math.floor((index - 1) / 2);
      }
    }
  
    bubbleDown() {
      let index = 0;
      const length = this.heap.length;
  
      while (true) {
        let left = 2 * index + 1;
        let right = 2 * index + 2;
        let smallest = index;
  
        if (left < length && this.heap[left].score < this.heap[smallest].score) {
          smallest = left;
        }
  
        if (right < length && this.heap[right].score < this.heap[smallest].score) {
          smallest = right;
        }
  
        if (smallest === index) break;
  
        [this.heap[index], this.heap[smallest]] =
          [this.heap[smallest], this.heap[index]];
        index = smallest;
      }
    }
  }
  
  function getTopN(notifications, n) {
    const heap = new MinHeap();
  
    for (const notif of notifications) {
      const scored = {
        ...notif,
        score: getScore(notif),
      };
  
      if (heap.size() < n) {
        heap.push(scored);
      } else if (scored.score > heap.peek().score) {
        heap.pop();
        heap.push(scored);
      }
    }
  
    return heap.heap.sort((a, b) => b.score - a.score);
  }
  
  module.exports = { getTopN };