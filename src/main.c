#include "wasm4.h"
#include <math.h>
#include <stdlib.h>

#define MAX_PARTICLES 500
#define MAX_STICKS 300
#define ITERATIONS 4

const uint8_t smiley[] = {
    0b11000011,
    0b10000001,
    0b00100100,
    0b00100100,
    0b00000000,
    0b00100100,
    0b10011001,
    0b11000011,
};

typedef struct
{
    double x;
    double y;
    double vx;
    double vy;
    int life;
} particle_t;

typedef struct
{
    particle_t *a;
    particle_t *b;
    double restLength;
    int life;
} stick_t;

particle_t particles[MAX_PARTICLES];
stick_t sticks[MAX_STICKS];
int particle_count = 0;
int stick_count;

int add_particle(particle_t particle)
{
    tracef("Adding particle %d\n", particle_count);
    tracef("-- %d\n", --particle_count);
    tracef("++ %d\n", ++particle_count);
    if (particle_count >= MAX_PARTICLES - 1)
        return -1;
    particles[particle_count++] = particle;
    tracef("now %d\n", particle_count);
    return particle_count - 1;
}

int add_stick(stick_t stick)
{
    if (stick_count >= MAX_STICKS - 1)
        return -1;
    sticks[stick_count++] = stick;
    return stick_count - 1;
}

// void remove_particle(int index)
// {
//     particles[index] = particles[--particle_count];
// }

// void remove_stick(int index)
// {
//     sticks[index] = sticks[--stick_count];
// }

int t = 0;

void step()
{
    for (int it = 0; it < ITERATIONS; it++)
    {
        for (int i = 0; i < stick_count; i++)
        {
            stick_t *s = &sticks[i];
            if (s->life > 0)
            {
                double dx = s->a->x - s->b->x;
                double dy = s->a->y - s->b->y;
                double d = sqrt(dx * dx + dy * dy);
                double delta = s->restLength - d;
                double force = delta * 0.00001;
                s->a->vx += force * dx;
                s->a->vy += force * dy;
                s->b->vx -= force * dx;
                s->b->vy -= force * dy;
            }
        }
    }

    // for (int i = 0; i < stick_count; i++)
    // {
    //     stick_t *s = &sticks[i];
    //     if (abs((int32_t)(s->a->x - s->b->x)) > 800 ||
    //         abs((int32_t)(s->a->y - s->b->y)) > 800 ||
    //         s->a->life <= 0 ||
    //         s->a->life <= 0)
    //     {
    //         s->life = 0;
    //     }
    // }
    // for (int i = 0; i < particle_count; i++)
    // {
    //     particle_t *p = &particles[i];
    //     if (p->life > 0)
    //     {
    //         p->x += p->vx;
    //         p->y += p->vy;
    //     }
    // }
}

void draw()
{

    *DRAW_COLORS = 2;
    text("Hello from C!", 10, 10);

    for (int i = 0; i < stick_count; i++)
    {
        stick_t *s = &sticks[i];
        if (s->life > 0)
        {
            // s->life -= 1;
            line((int32_t)s->a->x, (int32_t)s->a->y, (int32_t)s->b->x, (int32_t)s->b->y);
        }
    }

    for (int i = 0; i < particle_count; i++)
    {
        particle_t *p = &particles[i];
        if (p->life > 0)
        {
            p->life -= 1;
            blit(smiley, (int32_t)p->x, (int32_t)p->y, 8, 8, BLIT_1BPP);
        }
    }

    text("Press X to spawn", 16, 90);
    text("some particles!", 22, 103);
}

void update()
{
    t++;

    tracef("start of update, particle_count: %d\n", particle_count);
    
    uint8_t gamepad = *GAMEPAD1;
    if (gamepad & BUTTON_1)
    {
        *DRAW_COLORS = 4;

        particle_t p = {80, 80, sin(t), cos(t), 100};
        int p_i = add_particle(p);
        tracef("after add_particle, particle_count: %d\n", particle_count);
        if (p_i > -1)
        {
            stick_t stick = {&particles[p_i], &particles[p_i - 1], 10, 100};
            add_stick(stick);
        }
    }

    tracef("before step(), particle_count: %d\n", particle_count);
    step();
    tracef("after step(), particle_count: %d\n", particle_count);
    draw();
    tracef("end of update, particle_count: %d\n", particle_count);
}
