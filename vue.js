/*
 * @Descripttion: 
 * @version: 
 * @Author: zml
 * @Date: 2020-11-23 13:21:49
 * @LastEditors: zml
 * @LastEditTime: 2020-11-23 14:35:16
 */
// 定义构造函数
function Vue(option) {
    console.log(option,'option',this)
    this.$el = document.querySelector(option.el);
    this.$data = option.data;
    this.$methods = option.methods;
    this.deps = {} // 所有订阅者集合 目标格式（一对多的关系）：{msg:{订阅者1，订阅者2，订阅者3}}
    this.observer(this.$data) // 调用观察者
    this.compile(this.$el) // 调用指令解析器
}
// 定义指令解析器
Vue.prototype.compile = function(el) {
    console.log(el,'el')
    let nodes = el.children; // 获取挂载节点的子节点
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (node.children.length) {
            this.compile(node)
        }
        if (node.hasAttribute('l-model')) {
            let attrVal = node.getAttribute('l-model'); //  获取属性值
            node.addEventListener('input',(() => {
                this.deps[attrVal].push(new Watcher(node,"value",this, attrVal))
                let thisNode = node
                return () => {
                    this.$data[attrVal] = thisNode.value // 更新数据层的数据
                }
            })())
        }
        if (node.hasAttribute('l-html')) {
            let attrVal = node.getAttribute('l-html');
            this.deps[attrVal].push(new Watcher(node, "innerHTML",this,attrVal))
        }
        if (node.innerHTML.match(/{{([^\{|\}]+)}}/)) {
            let attrVal = node.innerHTML.replace(/[{{|}}]/g,'');
            this.deps[attrVal].push(new Watcher(node, "innerHTML",this,attrVal))
        }
        if (node.hasAttribute('l-on:click')) {
            let attrVal = node.getAttribute('l-on:click');
            node.addEventListener('click',this.$methods[attrVal].bind(this.$data))
        }
    }
}

// 定义观察者
// vue 2.0方式
// Vue.prototype.observer = function(data){
//     for(var key in data){
//         (function(that){
//             let val = data[key];    //每一个数据的属性值
//             that.deps[key] = [];    //初始化所有订阅者对象{msg: [订阅者], info: []}
//             var watchers = that.deps[key];
//             Object.defineProperty(data, key, {  //数据劫持
//                 get: function(){
//                     return val;
//                 },
//                 set: function(newVal){  //设置值(说明有数据更新)
//                     if(val !== newVal){
//                         val = newVal;
//                     }
//                     // 通知订阅者
//                     watchers.forEach(watcher=>{
//                         watcher.update()
//                     })
//                 }
//             })
//         })(this)
//     }
// }

// vue 3.0方式
Vue.prototype.observer = function (data) {
    const that = this
    for (var key in data) {
        that.deps[key] = []
    }
    let handler = {
        get(target,property) {
            return target[property]
        },
        set(target,key,value) {
            let res = Reflect.set(target,key,value)
            var watchers = that.deps[key];
            watchers.map(item => {
                item.update()
            })
            return res
        }
    }
    this.$data = new Proxy(data,handler)
}
function Watcher(el, attr, vm, attrVal) {
    this.el = el;
    this.attr = attr;
    this.vm = vm;
    this.val = attrVal
    this.update()
}

Watcher.prototype.update = function () {
    this.el[this.attr] = this.vm.$data[this.val]
}