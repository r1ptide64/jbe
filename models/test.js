var jbTest = function (name, id) {
    this.name = name;
    this.id = id
    this.print = function () {
        console.log('hello, this is ' + name);
    }
};

var retAry = [
    new jbTest('poop', '23id'),
    new jbTest('pee', 'peeid')
];

module.exports = retAry;